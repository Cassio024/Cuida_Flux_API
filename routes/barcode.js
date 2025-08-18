// Arquivo: routes/barcode.js (NOVO)
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

// @route   GET api/barcode/:gtin
// @desc    Busca informações de um produto pelo código de barras (GTIN)
// @access  Private
router.get('/:gtin', auth, async (req, res) => {
  const { gtin } = req.params;

  if (!process.env.COSMOS_TOKEN) {
    return res.status(500).json({ msg: 'API de consulta não configurada.' });
  }

  try {
    const response = await axios.get(`https://api.cosmos.bluesoft.com.br/gtins/${gtin}.json`, {
      headers: {
        'X-Cosmos-Token': process.env.COSMOS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    // Retorna a descrição do produto encontrado
    res.json({
      success: true,
      name: response.data.description
    });

  } catch (error) {
    console.error('Erro ao consultar API Cosmos:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ success: false, msg: 'Produto não encontrado.' });
    }
    res.status(500).json({ success: false, msg: 'Erro ao consultar o serviço de código de barras.' });
  }
});

module.exports = router;
