const { enviarNotificacao } = require('./fcmService');

function agendarAlarme(token, horarios, titulo, corpo) {
  const lista = Array.isArray(horarios) ? horarios : [horarios];
  lista.forEach(horario => {
    const tempo = new Date(horario).getTime() - Date.now();
    if (tempo > 0) {
      setTimeout(() => {
        enviarNotificacao(token, titulo, corpo);
      }, tempo);
    }
  });
}

module.exports = { agendarAlarme };
