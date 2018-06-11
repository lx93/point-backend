const plivo = require('plivo');
const request = require('request');

function sendMessage(dst, text) {

  const url = "https://api.plivo.com/v1/Account/" + process.env.PLIVO_AUTH_ID + "/Message/";
  const auth = process.env.PLIVO_AUTH_TOKEN;
  const options = {
    "url": url,
    "method": "POST",
    "headers": {
      "authorization": auth,
      "content-type": "application/json",
      "cache-control": "no-cache",
      "User-Agent": 'request'
    },
    "body": JSON.stringify({ src: '19198229889', dst: dst, text: text })
  };

  function callback(error, response, body) {
    if (!error) {
      console.log('Message sent!');
    } else {
      console.log('Message failed to send!');
    }
  };

  request(options, callback);
}

exports.sendMessage = sendMessage;
