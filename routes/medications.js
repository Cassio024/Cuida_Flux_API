// ARQUIVO CORRIGIDO E FINAL: routes/medications.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Medication = require('../models/Medication');

// @route   GET api/medications
// @desc    Obter os medicamentos do utilizador logado
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const medications = await Medication.find({ user: req.user.id }).sort({ date: -1 });
        res.json(medications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// @route   POST api/medications
// @desc    Adicionar um novo medicamento
// @access  Private
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
    const { name, dosage, schedules } = req.body;
    try {
        const newMedication = new Medication({
            name,
            dosage,
            schedules,
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
router.put('/:id', auth, async (req, res) => {
    const { name, dosage, schedules } = req.body;
    const medicationFields = {};
    if (name) medicationFields.name = name;
    if (dosage) medicationFields.dosage = dosage;
    if (schedules) medicationFields.schedules = schedules;
    try {
        let medication = await Medication.findById(req.params.id);
        if (!medication) return res.status(404).json({ msg: 'Medicamento não encontrado' });
        if (medication.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        medication = await Medication.findByIdAndUpdate(
            req.params.id,
            { $set: medicationFields },
            { new: true }
        );
        res.json(medication);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// @route   DELETE api/medications/:id
// @desc    Apagar um medicamento
// @access  Private
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

// oi