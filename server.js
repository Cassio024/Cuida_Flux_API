const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Conecta ao banco de dados
connectDB();

const app = express();

// --- INÍCIO DA ATUALIZAÇÃO (CORS) ---
// Mudei para liberar geral temporariamente para garantir que o erro suma.
app.use(cors()); 

// Se no futuro você quiser restringir novamente, use o código abaixo:
/*
app.use(cors({
    origin: ['https://vitalog-ac0ba.web.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
*/
// --- FIM DA ATUALIZAÇÃO ---

// Middleware para interpretar JSON
app.use(express.json({ extended: false }));

// Rota de teste
app.get('/', (req, res) => res.send('API VitaLog está a funcionar!'));

// Rotas da Aplicação
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/interactions', require('./routes/interactions'));

// --- ATUALIZAÇÃO DA ROTA DO CHATBOT ---
// Agora a rota base é /api/chatbot. 
// O endpoint final será: /api/chatbot/ask
app.use('/api/chatbot', require('./routes/chatbot'));
// ---------------------------------------

// ✅ Rota de alarmes
app.use('/api/alarms', require('./routes/alarms'));

// --- NOVA ROTA REGISTRADA ---
app.use('/api/barcode', require('./routes/barcode'));
// --- FIM DA NOVA ROTA ---

// Porta
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));