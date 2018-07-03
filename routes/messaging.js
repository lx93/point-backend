const express = require('express');

const messenger = require('../utils/messenger');

//api.pointup.io/messaging
const router = express.Router();

//Messaging

//Send message
router.post('/', function (req, res, next) {
  messenger.sendMessage(req, res, next);
});

module.exports = router;
