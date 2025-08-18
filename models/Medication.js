// Arquivo: models/Medication.js
const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  dosage: { 
    type: String, 
    required: true 
  },
  schedules: [{ 
    type: String, 
    required: true 
  }],
  date: { 
    type: Date, 
    default: Date.now 
  },
  // --- NOVOS CAMPOS ADICIONADOS ---
  expirationDate: {
    type: Date,
    required: false // Não é obrigatório no momento do cadastro inicial
  },
  qrCodeIdentifier: {
    type: String,
    unique: true,
    sparse: true // Permite múltiplos documentos com valor nulo, mas valores existentes devem ser únicos
  }
  // --- FIM DOS NOVOS CAMPOS ---
});

module.exports = mongoose.model('medication', MedicationSchema);
