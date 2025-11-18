// routes/chatbot.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializar cliente Gemini
// O SDK vai buscar automaticamente, mas passamos explícito para garantir
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Definição do Prompt do Sistema (Vitalog)
const SYSTEM_INSTRUCTION = `Você é um assistente especializado em saúde e medicamentos chamado Vitalog. 
Suas responsabilidades:
- Fornecer informações gerais sobre medicamentos e saúde
- Explicar interações medicamentosas básicas
- Dar dicas de bem-estar e saúde preventiva
- SEMPRE recomendar consultar um médico ou farmacêutico para questões específicas
- Nunca diagnosticar ou prescrever medicamentos
- Responder de forma clara e amigável em português brasileiro
- Nunca sair tema de remedios
- Sempre garantir a resposta completa
Importante: Você NÃO é um substituto para consulta médica profissional.`;

// Configuração do Modelo
const modelConfig = {
  model: "gemini-1.5-flash", // Modelo rápido e gratuito
  systemInstruction: SYSTEM_INSTRUCTION, // Instrução de sistema nativa do Gemini
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
  }
};

// Função para chamar a API Gemini
const getGeminiResponse = async (messages) => {
  try {
    console.log('🤖 Enviando mensagem para Gemini...');
    
    const model = genAI.getGenerativeModel(modelConfig);

    // O Gemini trabalha com histórico de chat de forma diferente.
    // Precisamos converter o array de mensagens do formato OpenAI/Groq para o formato Gemini.
    // Nota: Removemos a primeira mensagem se for o prompt de sistema, pois já está na config do modelo.
    
    const history = messages
      .filter(msg => msg.role !== 'system') // Removemos o system prompt manual antigo
      .slice(0, -1) // Pegamos tudo MENOS a última mensagem (que é a nova pergunta)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model', // Gemini usa 'model' ao invés de 'assistant'
        parts: [{ text: msg.content }]
      }));

    const lastMessage = messages[messages.length - 1].content;

    // Inicia o chat com o histórico
    const chat = model.startChat({
      history: history
    });

    // Envia a nova mensagem
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Resposta recebida do Gemini');
    return text;

  } catch (error) {
    console.error('❌ Erro ao chamar Gemini API:', error);
    throw error;
  }
};

// Endpoint principal do chatbot
router.post('/ask', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validação da mensagem
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem é obrigatória e deve ser uma string não vazia'
      });
    }

    // Validação da API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY não configurada');
      return res.status(500).json({
        success: false,
        error: 'Configuração de API incompleta'
      });
    }

    // Preparar histórico de conversa
    const limitedHistory = conversationHistory.slice(-6); 
    const messages = [
      ...limitedHistory,
      { role: 'user', content: message.trim() }
    ];

    console.log(`📨 Processando mensagem: "${message.substring(0, 50)}..."`);

    // Chamar a API Gemini
    const response = await getGeminiResponse(messages);

    // Resposta de sucesso
    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint do chatbot:', error);

    // Tratamento de erros genéricos (O SDK do Google não tem as mesmas classes de erro do Groq)
    let errorMessage = 'Desculpe, ocorreu um erro interno. Tente novamente.';
    let statusCode = 500;

    // Tenta identificar erros comuns pela mensagem
    const errString = error.toString().toLowerCase();
    
    if (errString.includes('api key') || errString.includes('auth')) {
       errorMessage = 'Erro de autenticação com a API';
       statusCode = 401;
    } else if (errString.includes('quota') || errString.includes('limit')) {
       errorMessage = 'Muitas requisições. Aguarde um momento.';
       statusCode = 429;
    } else if (errString.includes('fetch failed') || errString.includes('network')) {
       errorMessage = 'Erro de conexão. Verifique sua internet.';
       statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message
      })
    });
  }
});

// Endpoint de teste de conectividade
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testando conectividade com Gemini API...');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY não configurada',
        timestamp: new Date().toISOString()
      });
    }

    // Teste simples sem histórico
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent('Diga apenas "Teste de conexão bem-sucedido!"');
    const response = result.response.text();
    
    res.json({
      success: true,
      message: 'Conexão com Gemini API funcionando perfeitamente!',
      response: response,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.GEMINI_API_KEY
    });

  } catch (error) {
    console.error('❌ Teste de conexão falhou:', error);
    
    res.status(500).json({
      success: false,
      error: 'Falha na conexão com Gemini API',
      details: error.message,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.GEMINI_API_KEY
    });
  }
});

// Endpoint para listar modelos (Adaptado, pois o Gemini não lista da mesma forma simples)
router.get('/models', async (req, res) => {
  // Retornamos estático pois o SDK do cliente foca em inferência
  res.json({
    success: true,
    models: [
        { id: 'gemini-1.5-flash', owner: 'google' },
        { id: 'gemini-1.5-pro', owner: 'google' }
    ],
    timestamp: new Date().toISOString()
  });
});

// Endpoint de status da API
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'API Chatbot online (Gemini Powered)',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;