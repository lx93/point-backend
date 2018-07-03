const express = require('express');

const bController = require('../controllers/balances');

const balanceExist = require('../middleware/balanceExist');
const merchantValid = require('../middleware/merchantValid');
const paymentValid = require('../middleware/paymentValid');

//api.pointup.io/balances
const router = express.Router();

//Balances

//Get Balance
router.get('/:balanceId', balanceExist, bController.getBalance);

//Issue Balance
router.post('/', merchantValid, paymentValid, bController.issueBalance);

module.exports = router;
