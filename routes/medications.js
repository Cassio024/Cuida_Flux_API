// Arquivo: routes/medications.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Medication = require('../models/Medication');

// Rota GET (sem alterações)
router.get('/', auth, async (req, res) => {
    try {
        const medications = await Medication.find({ user: req.user.id }).sort({ date: -1 });
        res.json(medications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// Rota GET por QR Code (sem alterações)
router.get('/qr/:identifier', auth, async (req, res) => {
    try {
        const medication = await Medication.findOne({ qrCodeIdentifier: req.params.identifier, user: req.user.id });
        if (!medication) {
            return res.status(404).json({ msg: 'Medicamento não encontrado para este QR Code.' });
        }
        res.json(medication);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// Rota POST (sem alterações)
router.post('/', [
    auth,
    [
        check('name', 'Nome é obrigatório').not().isEmpty(),
        check('dosage', 'Dosagem é obrigatória').not().isEmpty(),
        check('schedules', 'Horários são obrigatórios e devem ser uma lista').isArray({ min: 1 }),
    ],
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, dosage, schedules, expirationDate, qrCodeIdentifier } = req.body;
    try {
        const newMedication = new Medication({
            name,
            dosage,
            schedules,
            expirationDate,
            qrCodeIdentifier,
            user: req.user.id,
        });
        const medication = await newMedication.save();
        res.json(medication);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   PUT api/medications/:id
// @desc    Atualizar um medicamento
// @access  Private
// --- LÓGICA DE ATUALIZAÇÃO MELHORADA ---
router.put('/:id', auth, async (req, res) => {
    const { name, dosage, schedules, expirationDate, qrCodeIdentifier, dosesTaken } = req.body;

    try {
        let medication = await Medication.findById(req.params.id);
        if (!medication) return res.status(404).json({ msg: 'Medicamento não encontrado' });
        if (medication.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        
        // Atualiza os campos de forma explícita
        if (name) medication.name = name;
        if (dosage) medication.dosage = dosage;
        if (schedules) medication.schedules = schedules;
        if (expirationDate) medication.expirationDate = expirationDate;
        if (qrCodeIdentifier) medication.qrCodeIdentifier = qrCodeIdentifier;
        if (dosesTaken) medication.dosesTaken = dosesTaken;

        // Guarda o documento completo
        const updatedMedication = await medication.save();

        res.json(updatedMedication);
    } catch (err) {
        console.error('Erro na rota PUT:', err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// Rota DELETE (sem alterações)
router.delete('/:id', auth, async (req, res) => {
    try {
        let medication = await Medication.findById(req.params.id);
        if (!medication) return res.status(404).json({ msg: 'Medicamento não encontrado' });
        if (medication.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        await Medication.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Medicamento removido' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

module.exports = router;
