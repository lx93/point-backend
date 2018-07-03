const express = require('express');

const bController = require('../controllers/balances');
const mController = require('../controllers/merchants');
const uController = require('../controllers/users');

const balanceValid = require('../middleware/balanceValid');
const imageValid = require('../middleware/imageValid');
const merchantValid = require('../middleware/merchantValid');
const userAuth = require('../middleware/userAuth');
const userExist = require('../middleware/userExist');

//api.pointup.io/users
const router = express.Router();

//Users

//Get info
router.get('/', userAuth, userExist, uController.getUser);

//Get all Merchants
router.get('/merchants', mController.getMerchantAll);

//Get one Merchant
router.get('/merchants/:merchantId', userAuth, userExist, merchantValid, mController.getMerchantOne);

//Verify
router.post('/verify', uController.verify);

//SignUp
router.post('/signup', uController.signUp);

//LogIn
router.post('/login', uController.logIn);

//Facebook Authorization
router.post('/fbAuth', uController.fbAuth);

//Recommend
//router.post('/recommend', userAuth, userExist, uController.recommend);

//Update
router.put('/name', userAuth, userExist, uController.updateName);
router.put('/image', userAuth, userExist, imageValid.single('image'), uController.updateImage);
router.put('/password', userAuth, userExist, uController.updatePassword);

//DeleteUser
router.delete('/', userAuth, userExist, uController.deleteUser/*, bController.userDelete*/);


//Balances

//Get Balances
router.get('/balances', userAuth, userExist, bController.userGetAll);

//Create Balance
router.post('/balances', userAuth, userExist, merchantValid, bController.userCreate);

//Update Balance
router.put('/balances', userAuth, userExist, balanceValid, bController.userUpdate);

//Regift Balance
router.put('/balances/regift', userAuth, userExist, balanceValid, bController.userRegift);

//Delete Balance
router.delete('/balances/:balanceId', userAuth, userExist, balanceValid, bController.userDeleteOne);

//(Debug)
router.delete('/balances', userAuth, userExist, bController.userDeleteAll);


//Transactions

//Get Transactions
router.get('/transactions', userAuth, userExist, bController.userGetTransactions);

module.exports = router;
