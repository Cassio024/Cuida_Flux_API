// Arquivo: models/Medication.js
const mongoose = require('mongoose');

const MedicationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true // Garante que todo medicamento esteja associado a um usuário
    },
    name: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
        required: true
    },
    schedules: {
        type: [String],
        required: true
    },
    expirationDate: {
        type: Date
    },
    qrCodeIdentifier: {
        type: String,
        unique: true,
        sparse: true // Permite múltiplos nulos, mas valores existentes devem ser únicos
    },
    // ✅ CAMPO ESSENCIAL PARA A NOVA FUNCIONALIDADE
    dosesTaken: {
        type: Map,
        of: Boolean,
        default: {} // Garante que o campo seja um mapa vazio por padrão
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('medication', MedicationSchema);
