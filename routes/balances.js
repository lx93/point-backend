const express = require('express');
const bController = require('../controllers/balances');
const balanceExist = require('../middleware/balanceExist');

//api.pointup.io/balances
const router = express.Router();

//Balances

//Get Balance
router.get('/:balanceId', balanceExist, bController.getBalance);

module.exports = router;
