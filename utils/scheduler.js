const { enviarNotificacao } = require('./fcmService');

function agendarAlarme(token, horario, titulo, corpo) {
  const tempo = new Date(horario).getTime() - Date.now();
  if (tempo <= 0) return;

  setTimeout(() => {
    enviarNotificacao(token, titulo, corpo);
  }, tempo);
}

module.exports = { agendarAlarme };
