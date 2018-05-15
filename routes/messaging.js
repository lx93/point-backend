const express = require('express');
const plivo = require('plivo');
const request = require('request');

//localhost:3000/messaging
const router = express.Router();

router.post('/', function (req, res, next) {

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
    "body": JSON.stringify({ src: '19198229889', dst: req.headers.dst, text: req.headers.text })
  };

  function callback(error, response, body) {
    if (!error) {
      console.log('Message sent!');
      return res.status(201).json({
        message: "Message sent!"
      });
    } else {
      console.log('Message failed to send!');
      return res.status(201).json({
        message: "Message failed to send!"
      });
    }
  };

  request(options, callback);
});

module.exports = router;
