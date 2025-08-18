const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Interaction = require('../models/Interaction');
const auth = require('../middleware/auth');

// Gera relatório em PDF das interações do usuário autenticado
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const interacoes = await Interaction.find({ user: userId }).sort({ data: -1 });

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="relatorio.pdf"');
        doc.pipe(res);

        doc.fontSize(20).text('Relatório de Interações do Usuário', { align: 'center' });
        doc.moveDown();

        interacoes.forEach((i, idx) => {
            const linha = `${idx + 1}. ${i.tipo || 'Interação Medicamentosa'} - ${i.descricao || i.warning || 'Sem descrição'} - ${new Date(i.data).toLocaleString()}`;
            doc.fontSize(12).text(linha);
        });

        doc.end();
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});

module.exports = router;
