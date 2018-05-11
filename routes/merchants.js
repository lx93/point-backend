const express = require('express');
const mController = require('../controllers/merchants');
const bController = require('../controllers/balances');
const merchantAuth = require('../middleware/merchantAuth');
const merchantExist = require('../middleware/merchantExist');
const balanceValid = require('../middleware/balanceValid');

//localhost:3000/merchants
const router = express.Router();

//Merchants

//Get info
router.get('/', merchantAuth, merchantExist, mController.getMerchant);

//SignUp
router.post('/signup', mController.signUp);

//LogIn
router.post('/login', mController.logIn);

//Update
router.put('/name', merchantAuth, merchantExist, mController.updateName);
router.put('/image', merchantAuth, merchantExist, mController.updateImage);
router.put('/password', merchantAuth, merchantExist, mController.updatePassword);

//DeleteMerchant
router.delete('/', merchantAuth, merchantExist, mController.deleteMerchant, bController.merchantDelete);


//Balances

//Get Balances
router.get('/balances', merchantAuth, merchantExist, bController.merchantGet);
router.get('/balances/:balanceId', merchantAuth, merchantExist, balanceValid, bController.merchantGetOne);

//Create Balance
router.post('/balances', merchantAuth, merchantExist, bController.merchantCreate);
router.post('/balances/:phone', merchantAuth, merchantExist, bController.merchantCreateFromURL);

//Update Balance
router.put('/balances', merchantAuth, merchantExist, bController.merchantUpdate);

//Delete Balance
router.delete('/balances/:balanceId', merchantAuth, merchantExist, balanceValid, bController.merchantDeleteOne);


module.exports = router;
