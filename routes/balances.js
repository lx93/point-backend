const express = require('express');
const bController = require('../controllers/balances');
const balanceValid = require('../middleware/balanceValid');

//api.pointup.io/balances
const router = express.Router();

//Balances

//Get Balance
router.get('/:balanceId', balanceValid, bController.getBalance);

module.exports = router;
