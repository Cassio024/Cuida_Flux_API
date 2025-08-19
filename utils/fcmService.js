const axios = require('axios');

function enviarNotificacao(token, titulo, corpo) {
  axios.post(
    'https://fcm.googleapis.com/fcm/send',
    {
      to: token,
      notification: {
        title: titulo,
        body: corpo,
        icon: '/icons/favicon.png',
        badge: '/icons/favicon.png',
        vibrate: [300, 200, 300, 200, 300]
      },
      data: { url: '/alarme' }
    },
    {
      headers: {
        Authorization: `key=${process.env.FCM_SERVER_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  ).catch(err => console.error('Erro ao enviar notificação:', err));
}

module.exports = { enviarNotificacao };
