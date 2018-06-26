const plivo = require('plivo');
const request = require('request');

function signup(merchantName, balance, balanceId, phone) {
  var output = "";
  output += "You just obtained a giftcard with " + merchantName + "!\n";
  output += "Your balance with " + merchantName + " is now $" + balance + "!\n";
  output += "View and redeem your Pointup Giftcard at app.point.io/" + balanceId + "!\n";
  output += "Recipient: " + phone;
  return ouput;
}

function updateCard(merchantName, balance, balanceId, phone) {
  var output = "";
  output += "Your balance with " + merchantName + " has been updated!\n";
  output += "Your balance with " + merchantName + " is now $" + balance + "!\n";
  output += "View and redeem your Pointup Giftcard at app.point.io/" + balanceId + "!\n";
  output += "Recipient: " + phone;
  return ouput;
}

async function sendText(res, dst, text) {

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
      return res.status(409).json({
        error: error
      });
    }
  };

  await request(options, callback);
}

function sendMessage(req, res, next) {

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
    "body": JSON.stringify({ src: '19198229889', dst: req.body.dst, text: req.body.text })
  };

  function callback(error, response, body) {
    if (!error) {
      console.log('Message sent!');
      return res.status(201).json({
        message: "Message sent!"
      });
    } else {
      console.log('Message failed to send!');
      return res.status(409).json({
        error: error
      });
    }
  };

  request(options, callback);
}

exports.sendMessage = sendMessage;
exports.sendText = sendText;
