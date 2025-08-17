const express = require('express');
const router = express.Router();
const { agendarAlarme } = require('../utils/scheduler');

router.post('/alarme', (req, res) => {
  const { token, horario, titulo, corpo } = req.body;
  agendarAlarme(token, horario, titulo, corpo);
  res.status(200).json({ message: 'Alarme agendado com sucesso!' });
});

module.exports = router;
