// Arquivo: routes/interactions.js

const express = require('express');
const router = express.Router();
// const axios = require('axios'); // <-- REMOVIDO: Não precisamos mais de chamadas externas
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');
const Medication = require('../models/Medication');

// 🔍 Verifica interações entre medicamentos por nome (LÓGICA CORRIGIDA PARA USAR O BANCO DE DADOS LOCAL)
router.post('/check', auth, async (req, res) => {
    const { medicationNames } = req.body;

    if (!Array.isArray(medicationNames) || medicationNames.length < 2) {
        return res.json({ hasInteraction: false, warnings: [] });
    }

    try {
        // --- INÍCIO DA LÓGICA ATUALIZADA ---

        // 1. Gera todas as combinações de pares de medicamentos a partir da lista recebida
        const pairs = [];
        for (let i = 0; i < medicationNames.length; i++) {
            for (let j = i + 1; j < medicationNames.length; j++) {
                // Limpa os nomes (remove dosagem, etc.) e converte para minúsculas para uma busca mais confiável
                const cleanMed1 = medicationNames[i].split(' ')[0].toLowerCase();
                const cleanMed2 = medicationNames[j].split(' ')[0].toLowerCase();
                pairs.push([cleanMed1, cleanMed2]);
            }
        }

        const warnings = [];

        // 2. Para cada par, consulta o banco de dados para ver se existe uma interação registrada
        for (const [med1, med2] of pairs) {
            // Cria "Expressões Regulares" para garantir que a busca não diferencie maiúsculas de minúsculas
            // Ex: "Paracetamol" no app vai encontrar "paracetamol" no banco de dados
            const med1Regex = new RegExp(`^${med1}$`, 'i');
            const med2Regex = new RegExp(`^${med2}$`, 'i');

            // Procura por um documento na coleção 'interactions' que contenha AMBOS os medicamentos
            const interaction = await Interaction.findOne({
                medications: { $all: [med1Regex, med2Regex] }
            });

            // 3. Se uma interação for encontrada, adiciona o aviso à lista de resultados
            if (interaction && interaction.warning && !warnings.includes(interaction.warning)) {
                warnings.push(interaction.warning);
            }
        }
        
        // --- FIM DA LÓGICA ATUALIZADA ---

        // A resposta mantém o formato que o seu app Flutter espera
        res.json({
            hasInteraction: warnings.length > 0,
            warnings
        });
    } catch (err) {
        console.error('Erro ao verificar interações no banco de dados local:', err.message);
        res.status(500).send('Erro no servidor ao verificar interações.');
    }
});

// ✅ Verifica interações entre medicamentos por ID (NÃO MODIFICADO)
// Esta rota continuará funcionando, pois ela chama a lógica de '/check' que acabamos de corrigir.
router.post('/', auth, async (req, res) => {
    const { medicationIds } = req.body;

    if (!Array.isArray(medicationIds) || medicationIds.length < 2) {
        return res.status(400).json({ hasInteraction: false, warnings: [] });
    }

    try {
        const medications = await Medication.find({ _id: { $in: medicationIds } });
        const medNames = medications.map(m => m.name);

        const fakeReq = { body: { medicationNames: medNames } };
        const fakeRes = { json: (data) => { res.status(200).json(data); } };

        // Chama a função da rota /check diretamente
        // Acessa o manipulador da rota para reutilizar a lógica
        const checkRouteHandler = router.stack.find(layer => layer.route && layer.route.path === '/check' && layer.route.methods.post).route.stack[0].handle;
        await checkRouteHandler(fakeReq, fakeRes);

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