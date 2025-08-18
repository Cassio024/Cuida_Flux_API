// Arquivo: routes/interactions.js (VERSÃO DE DEPURAÇÃO MÁXIMA)

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');
const Medication = require('../models/Medication');

router.post('/check', auth, async (req, res) => {
    console.log("\n\n--- [INÍCIO] NOVA REQUISIÇÃO /check ---");
    console.log(`[DATA/HORA]: ${new Date().toLocaleString('pt-BR')}`);

    try {
        console.log("[PASSO 1] Corpo bruto da requisição recebido:", JSON.stringify(req.body, null, 2));

        const { medicationNames } = req.body;
        if (!Array.isArray(medicationNames) || medicationNames.length < 2) {
            console.log("[AVISO] Requisição inválida ou com menos de 2 medicamentos. Encerrando.");
            return res.json({ hasInteraction: false, warnings: [] });
        }
        console.log("[PASSO 2] Nomes originais extraídos:", medicationNames);

        const cleanMedNames = medicationNames.map(name => 
            name.trim().toLowerCase().split(' ')[0]
        );
        console.log("[PASSO 3] Nomes normalizados (limpos e em minúsculas):", cleanMedNames);

        const pairs = [];
        for (let i = 0; i < cleanMedNames.length; i++) {
            for (let j = i + 1; j < cleanMedNames.length; j++) {
                pairs.push([cleanMedNames[i], cleanMedNames[j]]);
            }
        }
        console.log("[PASSO 4] Pares de medicamentos a serem verificados:", pairs);

        const warnings = [];
        console.log("\n[PASSO 5] Iniciando busca no MongoDB para cada par...");

        for (const [med1, med2] of pairs) {
            console.log(`  -> Verificando par: [${med1}, ${med2}]`);
            const med1Regex = new RegExp(`^${med1}$`, 'i');
            const med2Regex = new RegExp(`^${med2}$`, 'i');
            const query = { medications: { $all: [med1Regex, med2Regex] } };
            console.log(`     - Query exata enviada ao MongoDB: ${JSON.stringify(query)}`);

            const interaction = await Interaction.findOne(query);
            console.log(`     - Resultado da busca: ${interaction ? 'DOCUMENTO ENCONTRADO' : 'Nenhum documento (null)'}`);
            if(interaction) console.log('       - Documento:', JSON.stringify(interaction, null, 2))

            if (interaction && interaction.warning && !warnings.includes(interaction.warning)) {
                warnings.push(interaction.warning);
            }
        }
        console.log("\n[PASSO 6] Busca no banco de dados finalizada.");

        const finalResponse = {
            hasInteraction: warnings.length > 0,
            warnings
        };
        console.log("[PASSO 7] Resposta final que será enviada para o Flutter:", JSON.stringify(finalResponse, null, 2));

        res.json(finalResponse);

    } catch (err) {
        console.error('[ERRO FATAL] Ocorreu um erro durante o processo:', err);
        res.status(500).send('Erro no servidor ao verificar interações.');
    } finally {
        console.log("--- [FIM] REQUISIÇÃO /check ---");
    }
});

// Manter as outras rotas como estão
router.post('/', auth, async (req, res) => { /* ... sua lógica ... */ });
router.post('/registrar', auth, async (req, res) => { /* ... sua lógica ... */ });

module.exports = router;