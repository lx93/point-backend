const express = require('express');

const bController = require('../controllers/balances');
const mController = require('../controllers/merchants');

const balanceValid = require('../middleware/balanceValid');
const imageValid = require('../middleware/imageValid');
const merchantAuth = require('../middleware/merchantAuth');
const merchantExist = require('../middleware/merchantExist');

//api.pointup.io/merchants
const router = express.Router();

//Merchants

//Get info
router.get('/', merchantAuth, merchantExist, mController.getMerchant);

//Verify
router.post('/verify', mController.verify);

//SignUp
router.post('/signup', mController.signUp, bController.merchantRestore);

//LogIn
router.post('/login', mController.logIn);

//Update
router.put('/name', merchantAuth, merchantExist, mController.updateName);
router.put('/image', merchantAuth, merchantExist, imageValid.single('image'), mController.updateImage);
router.put('/password', merchantAuth, merchantExist, mController.updatePassword);

//DeleteMerchant
router.delete('/', merchantAuth, merchantExist, mController.deleteMerchant, bController.merchantDeleteAll);


//Balances

//Get Balances
router.get('/balances', merchantAuth, merchantExist, bController.merchantGetAll);

//Create Balance
router.post('/balances', merchantAuth, merchantExist, bController.merchantCreate);

//Update Balance
router.put('/balances', merchantAuth, merchantExist, balanceValid, bController.merchantUpdate);

//Delete Balance
router.delete('/balances/:balanceId', merchantAuth, merchantExist, balanceValid, bController.merchantDeleteOne);

//(Debug)
router.delete('/balances', merchantAuth, merchantAuth, bController.merchantDeleteAll);


//Transactions

//Get Transactions
router.get('/transactions', merchantAuth, merchantExist, bController.merchantGetTransactions);

module.exports = router;
