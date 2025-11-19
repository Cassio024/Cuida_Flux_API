// routes/chatbot.js
const express = require('express');
const router = express.Router();
// Usamos a biblioteca OpenAI, que é compatível com OpenRouter
const OpenAI = require("openai"); 

// Inicializar cliente OpenRouter
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1", // ✅ ENDPOINT OPENROUTER
    apiKey: process.env.OPENROUTER_API_KEY, // ✅ CHAVE OPENROUTER
});

// Função para chamar a API OpenRouter
const getRouterResponse = async (messages) => {
    try {
        console.log('🤖 Enviando mensagem para OpenRouter...');

        // O SDK da OpenAI usa o método completions.create
        const chatCompletion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct", // ✅ MODELO GRATUITO E ESTÁVEL
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        console.log('✅ Resposta recebida do OpenRouter');
        return chatCompletion.choices[0].message.content;

    } catch (error) {
        console.error('❌ Erro ao chamar OpenRouter API:', error);
        throw error;
    }
};

// Middleware para incluir o prompt de sistema Vitalog
const applySystemPrompt = (req, res, next) => {
    const { message, conversationHistory = [] } = req.body;

    // 1. Definição do Prompt do Sistema (Vitalog)
    const systemPrompt = {
        role: "system",
        content: `Você é um assistente especializado em saúde e medicamentos chamado CuidaFlux. 
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
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('❌ OPENROUTER_API_KEY não configurada');
            return res.status(500).json({
                success: false,
                error: 'Configuração de API incompleta'
            });
        }

        console.log(`📨 Processando mensagem: "${message.substring(0, 50)}..."`);

        // Chamar a API OpenRouter
        const response = await getRouterResponse(req.messages);

        // Resposta de sucesso
        res.json({
            success: true,
            data: {
                response: response,
                timestamp: new Date().toISOString(),
                model: 'mistralai/mistral-7b-instruct'
            }
        });

    } catch (error) {
        console.error('❌ Erro no endpoint do chatbot:', error);

        // Tratamento de erros
        let errorMessage = 'Desculpe, o assistente de saúde está indisponível no momento.';
        let statusCode = 500;
        
        const errString = error.toString().toLowerCase();

        if (errString.includes('unauthorized') || errString.includes('api key')) {
             errorMessage = 'Erro de autenticação com a API (Chave OpenRouter Inválida)';
             statusCode = 401;
        } else if (errString.includes('rate limit')) {
             errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
             statusCode = 429;
        } 

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
        });
    }
});

module.exports = router;