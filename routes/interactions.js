const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interaction = require('../models/Interaction');

router.post('/check', auth, async (req, res) => {
    const { medicationNames } = req.body;
    if (!medicationNames || medicationNames.length < 2) {
        return res.json({ hasInteraction: false, warnings: [] });
    }

    try {
        const pairs = [];
        for (let i = 0; i < medicationNames.length; i++) {
            for (let j = i + 1; j < medicationNames.length; j++) {
                pairs.push([medicationNames[i], medicationNames[j]]);
            }
        }

        const warnings = [];

        for (const pair of pairs) {
            const med1Regex = new RegExp(`^${pair[0]}$`, 'i');
            const med2Regex = new RegExp(`^${pair[1]}$`, 'i');

            const interactionFound = await Interaction.findOne({
                medications: { $all: [med1Regex, med2Regex] }
            });

            if (interactionFound && interactionFound.warning) {
                warnings.push(interactionFound.warning);
            }
        }

        const hasInteraction = warnings.length > 0;
        return res.json({ hasInteraction, warnings });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao verificar interações.');
    }
});

module.exports = router;
