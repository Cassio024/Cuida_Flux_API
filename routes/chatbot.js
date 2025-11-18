// routes/chatbot.js
const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Inicializar cliente Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Função para chamar a API Groq
const getGroqResponse = async (messages) => {
  try {
    console.log('🤖 Enviando mensagem para Groq...');
    
    // O sistema prompt já está incluído no array 'messages'
    const chatCompletion = await groq.chat.completions.create({
      messages: messages, // O array já contém o System Prompt e o histórico
      model: "llama3-8b-8192-openrouter", // ✅ MODELO ATUALIZADO AQUI!
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    console.log('✅ Resposta recebida do Groq');
    return chatCompletion.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erro ao chamar Groq API:', error);
    
    // Log detalhado do erro para debug
    if (error instanceof Groq.APIError) {
      console.error('API Error Details:');
      console.error('- Status:', error.status);
    }
    
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
                      Suas responsabilidades:
                      - Fornecer informações gerais sobre medicamentos e saúde
                      - Explicar interações medicamentosas básicas
                      - Dar dicas de bem-estar e saúde preventiva
                      - SEMPRE recomendar consultar um médico ou farmacêutico para questões específicas
                      - Nunca diagnosticar ou prescrever medicamentos
                      - Responder de forma clara e amigável em português brasileiro
                      - Nunca sair tema de remedios
                      - Sempre garantir a resposta completa
                      Importante: Você NÃO é um substituto para consulta médica profissional.`
    };
    
    // 2. Prepara histórico de conversa (limitar para evitar excesso de tokens)
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
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY não configurada');
      return res.status(500).json({
        success: false,
        error: 'Configuração de API incompleta'
      });
    }

    console.log(`📨 Processando mensagem: "${message.substring(0, 50)}..."`);

    // Chamar a API Groq usando o array preparado no middleware
    const response = await getGroqResponse(req.messages);

    // Resposta de sucesso
    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString(),
        model: 'llama3-8b-8192-openrouter' // ✅ MODELO NOVO AQUI
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint do chatbot:', error);

    // Tratamento de erros específicos (usando classes Groq nativas)
    let errorMessage = 'Desculpe, ocorreu um erro interno. Tente novamente.';
    let statusCode = 500;

    if (error instanceof Groq.AuthenticationError) {
      errorMessage = 'Erro de autenticação com a API (Chave inválida)';
      statusCode = 401;
      console.error('🔑 API Key inválida ou expirada');
    } else if (error instanceof Groq.RateLimitError) {
      errorMessage = 'Muitas requisições. Aguarde um momento.';
      statusCode = 429;
    } 

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
});

module.exports = router;