const express = require('express');

const bController = require('../controllers/balances');

const balanceExist = require('../middleware/balanceExist');
const merchantValid = require('../middleware/merchantValid');
const paymentValid = require('../middleware/webPaymentValid');

const getDiscount = require('../utils/getDiscount');

//api.pointup.io/balances
const router = express.Router();

//Balances

//Get Balance
router.get('/:balanceId', balanceExist, bController.getBalance);

//Issue Balance
router.post('/', merchantValid, paymentValid, bController.issueBalance);

//Get Discount
router.post('/discount', (req, res, next) => {
  getDiscount.get(req, res, next);
});

module.exports = router;
