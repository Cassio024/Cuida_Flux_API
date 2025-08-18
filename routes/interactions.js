// Arquivo: routes/interactions.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');
const Medication = require('../models/Medication');

// 🔍 Verifica interações entre medicamentos por nome
router.post('/check', auth, async (req, res) => {
    const { medicationNames } = req.body;

    if (!Array.isArray(medicationNames) || medicationNames.length < 2) {
        return res.json({ hasInteraction: false, warnings: [] });
    }

    try {
        // --- MUDANÇA CRUCIAL AQUI ---
        // Normaliza a lista de nomes recebida do aplicativo.
        const cleanMedNames = medicationNames.map(name => 
            name.trim().toLowerCase().split(' ')[0]
        );

        // Gera os pares usando a lista de nomes já limpa.
        const pairs = [];
        for (let i = 0; i < cleanMedNames.length; i++) {
            for (let j = i + 1; j < cleanMedNames.length; j++) {
                pairs.push([cleanMedNames[i], cleanMedNames[j]]);
            }
        }

        const warnings = [];

        for (const [med1, med2] of pairs) {
            // A busca agora usa os nomes limpos, então a chance de encontrar é muito maior.
            const med1Regex = new RegExp(`^${med1}$`, 'i');
            const med2Regex = new RegExp(`^${med2}$`, 'i');

            const interaction = await Interaction.findOne({
                medications: { $all: [med1Regex, med2Regex] }
            });

            if (interaction && interaction.warning && !warnings.includes(interaction.warning)) {
                warnings.push(interaction.warning);
            }
        }

        res.json({
            hasInteraction: warnings.length > 0,
            warnings
        });
    } catch (err) {
        console.error('Erro ao verificar interações por nome:', err.message);
        res.status(500).send('Erro no servidor ao verificar interações.');
    }
});

// ✅ Verifica interações entre medicamentos por ID
router.post('/', auth, async (req, res) => {
    const { medicationIds } = req.body;

    if (!Array.isArray(medicationIds) || medicationIds.length < 2) {
        return res.status(400).json({ interactions: [] });
    }

    try {
        const medications = await Medication.find({ _id: { $in: medicationIds } });
        // A normalização já acontece aqui, o que é ótimo!
        const medNames = medications.map(m => m.name.toLowerCase());

        const interactionsFound = [];

        for (let i = 0; i < medNames.length; i++) {
            for (let j = i + 1; j < medNames.length; j++) {
                const interaction = await Interaction.findOne({
                    medications: {
                        $all: [
                            new RegExp(`^${medNames[i].split(' ')[0]}$`, 'i'), // Adicionado split para segurança
                            new RegExp(`^${medNames[j].split(' ')[0]}$`, 'i')  // Adicionado split para segurança
                        ]
                    }
                });

                if (interaction && interaction.warning && !interactionsFound.includes(interaction.warning)) {
                    interactionsFound.push(interaction.warning);
                }
            }
        }
        
        // A resposta aqui é diferente da rota /check, vamos padronizar
        res.status(200).json({
            hasInteraction: interactionsFound.length > 0,
            warnings: interactionsFound
        });
    } catch (err) {
        console.error('Erro ao verificar interações por ID:', err.message);
        res.status(500).json({ error: 'Erro interno ao verificar interações por ID.' });
    }
});


// 📝 Registra qualquer tipo de interação do usuário
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