const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Este schema representa um medicamento individual no sistema
const MedicationSchema = new Schema({
  // Nome do medicamento (único e obrigatório)
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  // (Opcional) Categoria ou classe do medicamento
  category: {
    type: String,
    required: false,
  },

  // (Opcional) Informações adicionais sobre o medicamento
  description: {
    type: String,
    required: false,
  },

  // Data de criação automática
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// 🔍 Index para facilitar buscas por nome
MedicationSchema.index({ name: 1 });

module.exports = mongoose.model('Medication', MedicationSchema);
