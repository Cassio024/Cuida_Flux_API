// routes/chatbot.js
const express = require('express');
const router = express.Router();
// ⬇️ CORREÇÃO DA IMPORTAÇÃO ⬇️
// Usamos a desestruturação para extrair a classe construtora nomeada
const { MistralClient } = require('@mistralai/mistralai');
// ⬆️ FIM DA CORREÇÃO ⬆️

// Inicializar cliente Mistral
const mistral = new MistralClient(process.env.MISTRAL_API_KEY);

// Função para chamar a API Mistral
const getMistralResponse = async (messages) => {
  try {
    console.log('🤖 Enviando mensagem para Mistral AI...');

    // O SDK da Mistral usa o método chat()
    const chatCompletion = await mistral.chat({
      model: "mistral-tiny", // ✅ Modelo rápido e estável da Mistral
      messages: messages,
      temperature: 0.7,
    });

    console.log('✅ Resposta recebida da Mistral AI');
    // A resposta da Mistral é um objeto, extraímos o conteúdo do primeiro item
    return chatCompletion.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erro ao chamar Mistral API:', error);
    throw error;
  }
};

// Middleware para incluir o prompt de sistema Vitalog
const applySystemPrompt = (req, res, next) => {
  const { message, conversationHistory = [] } = req.body;

  // 1. Definição do Prompt do Sistema (Vitalog)
  const systemPrompt = {
    role: "system",
    content: `Você é um assistente especializado em saúde e medicamentos chamado Vitalog. 
                      Sua única responsabilidade é fornecer informações claras e amigáveis em português brasileiro sobre medicamentos, interações básicas e bem-estar.
                      SEMPRE lembre o usuário de consultar um médico ou farmacêutico. NUNCA diagnostique ou prescreva.`
  };

  // 2. Prepara histórico de conversa
  const limitedHistory = conversationHistory.slice(-6);
  const messages = [
    systemPrompt,
    ...limitedHistory,
    { role: 'user', content: message.trim() }
  ];

  req.messages = messages;
  next();
};

// Endpoint principal do chatbot
router.post('/ask', applySystemPrompt, async (req, res) => {
  try {
    const { message } = req.body;

    // Validação da mensagem
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem é obrigatória e deve ser uma string não vazia'
      });
    }

    // Validação da API key
    if (!process.env.MISTRAL_API_KEY) {
      console.error('❌ MISTRAL_API_KEY não configurada');
      return res.status(500).json({
        success: false,
        error: 'Configuração da API Mistral Incompleta'
      });
    }

    console.log(`📨 Processando mensagem: "${message.substring(0, 50)}..."`);

    // Chamar a API Mistral
    const response = await getMistralResponse(req.messages);

    // Resposta de sucesso
    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString(),
        model: 'mistral-tiny'
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint do chatbot:', error);

    // Tratamento de erros
    let errorMessage = 'Desculpe, o assistente de saúde está indisponível no momento.';
    let statusCode = 500;

    const errString = error.toString().toLowerCase();

    if (errString.includes('unauthorized') || errString.includes('api key')) {
      errorMessage = 'Erro de autenticação com a API (Chave Mistral Inválida)';
      statusCode = 401;
    } else if (errString.includes('rate limit')) {
      errorMessage = 'Limite de requisições excedido.';
      statusCode = 429;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
});

module.exports = router;