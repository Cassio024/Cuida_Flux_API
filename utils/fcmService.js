const axios = require('axios');

function enviarNotificacao(token, titulo, corpo) {
  axios.post('https://fcm.googleapis.com/fcm/send', {
    to: token,
    notification: {
      title: titulo,
      body: corpo
    }
  }, {
    headers: {
      Authorization: `key=${process.env.FCM_SERVER_KEY}`,
      'Content-Type': 'application/json'
    }
  }).catch(err => console.error('Erro ao enviar notificação:', err));
}

module.exports = { enviarNotificacao };
