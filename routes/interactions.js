const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');
const Medication = require('../models/Medication');

// 🔍 Verifica interações entre medicamentos por nome
router.post('/check', auth, async (req, res) => {
    // --- LOGS PARA DIAGNÓSTICO ---
    console.log("\n--- NOVA VERIFICAÇÃO DE INTERAÇÃO ---");
    console.log("1. Nomes recebidos do App:", req.body.medicationNames);

    const { medicationNames } = req.body;
    if (!Array.isArray(medicationNames) || medicationNames.length < 2) {
        return res.json({ hasInteraction: false, warnings: [] });
    }

    try {
        // --- CORREÇÃO ESSENCIAL ---
        // Limpa os nomes antes de usá-los (remove espaços, converte para minúsculas, pega só a primeira palavra)
        const cleanMedNames = medicationNames.map(name => 
            name.trim().toLowerCase().split(' ')[0]
        );
        console.log("2. Nomes após limpeza (normalizados):", cleanMedNames);

        // Gera os pares usando a lista de nomes já limpa
        const pairs = [];
        for (let i = 0; i < cleanMedNames.length; i++) {
            for (let j = i + 1; j < cleanMedNames.length; j++) {
                pairs.push([cleanMedNames[i], cleanMedNames[j]]);
            }
        }
        console.log("3. Pares que serão buscados no banco:", pairs);

        const warnings = [];

        for (const [med1, med2] of pairs) {
            console.log(`4. Buscando o par: ["${med1}", "${med2}"]`);
            const med1Regex = new RegExp(`^${med1}$`, 'i');
            const med2Regex = new RegExp(`^${med2}$`, 'i');

            const interaction = await Interaction.findOne({
                medications: { $all: [med1Regex, med2Regex] }
            });
            
            // Log para ver o que o banco de dados retornou
            console.log("5. Resultado da busca:", interaction ? "DOCUMENTO ENCONTRADO" : "Nada encontrado (null)");

            if (interaction && interaction.warning && !warnings.includes(interaction.warning)) {
                warnings.push(interaction.warning);
            }
        }

        const finalResponse = {
            hasInteraction: warnings.length > 0,
            warnings
        };

        console.log("6. Resposta final enviada para o App:", finalResponse);
        res.json(finalResponse);
        
    } catch (err) {
        console.error('Erro ao verificar interações por nome:', err.message);
        res.status(500).send('Erro no servidor ao verificar interações.');
    }
});

// ✅ Verifica interações entre medicamentos por ID (mantido como no seu original)
router.post('/', auth, async (req, res) => {
    const { medicationIds } = req.body;
    if (!Array.isArray(medicationIds) || medicationIds.length < 2) {
        return res.status(400).json({ interactions: [] });
    }
    try {
        const medications = await Medication.find({ _id: { $in: medicationIds } });
        const medNames = medications.map(m => m.name.toLowerCase());
        const interactionsFound = [];
        for (let i = 0; i < medNames.length; i++) {
            for (let j = i + 1; j < medNames.length; j++) {
                const interaction = await Interaction.findOne({
                    medications: {
                        $all: [
                            new RegExp(`^${medNames[i]}$`, 'i'),
                            new RegExp(`^${medNames[j]}$`, 'i')
                        ]
                    }
                });
                if (interaction && interaction.warning && !interactionsFound.includes(interaction.warning)) {
                    interactionsFound.push(interaction.warning);
                }
            }
        }
        res.status(200).json({ interactions: interactionsFound });
    } catch (err) {
        console.error('Erro ao verificar interações por ID:', err.message);
        res.status(500).json({ error: 'Erro interno ao verificar interações por ID.' });
    }
});

// 📝 Registra qualquer tipo de interação do usuário (mantido como no seu original)
router.post('/registrar', auth, async (req, res) => {
    try {
        const { tipo, descricao } = req.body;
        const userId = req.user.id;
        const novaInteracao = new Interaction({
            tipo,
            descricao,
            user: userId,
        });
        await novaInteracao.save();
        res.status(201).json(novaInteracao);
    } catch (err) {
        console.error('Erro ao registrar interação:', err.message);
        res.status(500).json({ error: 'Erro ao registrar interação' });
    }
});

module.exports = router;