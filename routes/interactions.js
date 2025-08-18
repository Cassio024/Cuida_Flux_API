// Arquivo: routes/interactions.js

const express = require('express');
const router = express.Router();
const axios = require('axios'); // <-- ADICIONADO: Para fazer chamadas à API externa
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction'); // Mantido para a rota /registrar
const Medication = require('../models/Medication');   // Mantido para a rota /

// 🔍 Verifica interações entre medicamentos por nome (LÓGICA ATUALIZADA)
router.post('/check', auth, async (req, res) => {
    const { medicationNames } = req.body;

    if (!Array.isArray(medicationNames) || medicationNames.length < 2) {
        return res.json({ hasInteraction: false, warnings: [] });
    }

    try {
        // --- INÍCIO DA LÓGICA MODIFICADA ---

        // 1. Converter nomes de medicamentos para códigos RxCUI (usados pela API)
        const drugCodes = [];
        for (const name of medicationNames) {
            // Remove informações de dosagem para melhorar a busca (ex: "Paracetamol 500mg" -> "Paracetamol")
            const cleanName = name.split(' ')[0];
            const rxcuiResponse = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(cleanName)}`);
            
            if (rxcuiResponse.data.idGroup.rxnormId) {
                drugCodes.push(rxcuiResponse.data.idGroup.rxnormId[0]);
            }
        }

        if (drugCodes.length < 2) {
            return res.json({ hasInteraction: false, warnings: [] });
        }

        // 2. Verificar interações usando os códigos obtidos
        const codesString = drugCodes.join('+');
        const interactionResponse = await axios.get(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${codesString}`);

        const interactionGroups = interactionResponse.data.fullInteractionTypeGroup;
        const warnings = [];

        if (interactionGroups) {
            interactionGroups.forEach(group => {
                group.fullInteractionType.forEach(interactionType => {
                    interactionType.interactionPair.forEach(pair => {
                        if (!warnings.includes(pair.description)) {
                            warnings.push(pair.description);
                        }
                    });
                });
            });
        }
        
        // --- FIM DA LÓGICA MODIFICADA ---

        // A resposta mantém o formato que o seu app Flutter espera
        res.json({
            hasInteraction: warnings.length > 0,
            warnings
        });
    } catch (err) {
        console.error('Erro ao verificar interações com a API externa:', err.message);
        // Em caso de erro na API externa, retorne sem interação para não bloquear o usuário
        res.status(200).json({ hasInteraction: false, warnings: [] });
    }
});

// ✅ Verifica interações entre medicamentos por ID (LÓGICA ATUALIZADA)
router.post('/', auth, async (req, res) => {
    // Esta rota agora reaproveita a lógica da rota /check
    const { medicationIds } = req.body;

    if (!Array.isArray(medicationIds) || medicationIds.length < 2) {
        return res.status(400).json({ hasInteraction: false, warnings: [] });
    }

    try {
        const medications = await Medication.find({ _id: { $in: medicationIds } });
        const medNames = medications.map(m => m.name);

        // Criar uma requisição "fake" para chamar a lógica de /check internamente
        const fakeReq = {
            body: { medicationNames: medNames }
        };
        
        const fakeRes = {
            // Criamos uma função json "fake" que nos permitirá capturar a resposta
            json: (data) => {
                res.status(200).json(data);
            }
        };

        // Chamar a função da rota /check diretamente
        await router.stack.find(layer => layer.route.path === '/check').route.stack[0].handle(fakeReq, fakeRes);

    } catch (err) {
        console.error('Erro ao buscar medicamentos por ID:', err.message);
        res.status(500).json({ error: 'Erro interno ao verificar interações.' });
    }
});

// 📝 Registra qualquer tipo de interação do usuário (NÃO MODIFICADO)
router.post('/registrar', auth, async (req, res) => {
    try {
        const { tipo, descricao } = req.body;
        const userId = req.user.id;
        const novaInteracao = new Interaction({ tipo, descricao, user: userId });
        await novaInteracao.save();
        res.status(201).json(novaInteracao);
    } catch (err) {
        console.error('Erro ao registrar interação:', err.message);
        res.status(500).json({ error: 'Erro ao registrar interação' });
    }
});

module.exports = router;