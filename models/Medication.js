// Arquivo: models/Medication.js
// (Sem alterações)
const mongoose = require('mongoose');
const MedicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  schedules: [{ type: String, required: true }],
  date: { type: Date, default: Date.now },
});
module.exports = mongoose.model('medication', MedicationSchema);

// oi