const express = require('express');
const uController = require('../controllers/users');
const bController = require('../controllers/balances');
const userAuth = require('../middleware/userAuth');
const userExist = require('../middleware/userExist');
const merchantValid = require('../middleware/merchantValid');
const balanceValid = require('../middleware/balanceValid');

//localhost:3000/users
const router = express.Router();

//Users

//Get info
router.get('/', userAuth, userExist, uController.getUser);

//SignUp
router.post('/signup', uController.signUp);

//LogIn
router.post('/login', uController.logIn);

//Recommend
router.post('/recommend', userAuth, userExist, uController.recommend);

//Update
router.put('/password', userAuth, userExist, uController.updatePassword);

//DeleteUser
router.delete('/', userAuth, userExist, uController.deleteUser, bController.userDelete);


//Balances

//Get Balances
router.get('/balances', userAuth, userExist, bController.userGet);
//router.get('/balances/:balanceId', userAuth, userExist, balanceValid, bController.userGetFromURL);

//Create Balance
router.post('/balances', userAuth, userExist, merchantValid, bController.userCreate);
router.post('/balances/:merchantId', userAuth, userExist, merchantValid, bController.userCreateFromURL);

//Delete Balance
router.delete('/balances/:balanceId', userAuth, userExist, balanceValid, bController.userDeleteFromURL);

//(Debug)
router.delete('/balances', userAuth, userExist, bController.userDelete);

module.exports = router;
