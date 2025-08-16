const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InteractionSchema = new Schema({
  medications: {
    type: [String],
    required: false,
  },
  warning: {
    type: String,
    required: false,
  },
  tipo: {
    type: String,
    enum: ['Adicionou remédio', 'Removeu aviso', 'Verificou interação', 'Outro'],
    required: false,
  },
  descricao: {
    type: String,
    required: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: false,
  },
  data: {
    type: Date,
    default: Date.now,
  }
});

// Index para melhorar performance em buscas por medicamentos
InteractionSchema.index({ medications: 1 });

module.exports = mongoose.model('Interaction', InteractionSchema);
