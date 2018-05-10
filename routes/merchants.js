const express = require('express');
const mController = require('../controllers/merchants');
const bController = require('../controllers/balances');
const merchantAuth = require('../middleware/merchantAuth');
const merchantExist = require('../middleware/merchantExist');

const router = express.Router();

//Get info
router.get('/', merchantAuth, merchantExist, mController.getMerchant);

//SignUp
router.post('/signup', mController.signUp);

//LogIn
router.post('/login', mController.logIn);

//Update
router.put('/', merchantAuth, merchantExist, mController.update);

//DeleteMerchant
router.delete('/', merchantAuth, merchantExist, mController.deleteMerchant, bController.merchantDelete);


module.exports = router;
