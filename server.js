const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Conecta ao banco de dados
connectDB();

const app = express();

// --- INÍCIO DA ATUALIZAÇÃO NECESSÁRIA ---
// CORS configurado de forma mais simples e direta
app.use(cors({
    origin: [
        'https://vitalog-ac0ba.web.app', // URL do seu app em produção
        /http:\/\/localhost:\d+/,      // Expressão regular para permitir qualquer porta em localhost
        /http:\/\/127\.0\.0\.1:\d+/      // Expressão regular para permitir qualquer porta em 127.0.0.1
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
// --- FIM DA ATUALIZAÇÃO ---

// Middleware para interpretar JSON
app.use(express.json({ extended: false }));

// Rota de teste
app.get('/', (req, res) => res.send('API VitaLog está a funcionar!'));

// Rotas da Aplicação
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/', require('./routes/chatbot'));


// ✅ Rota de alarmes
app.use('/api/alarms', require('./routes/alarms'));

// --- NOVA ROTA REGISTRADA ---
app.use('/api/barcode', require('./routes/barcode'));
// --- FIM DA NOVA ROTA ---


// Porta
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));