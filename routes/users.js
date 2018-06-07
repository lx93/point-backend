const express = require('express');
const uController = require('../controllers/users');
const bController = require('../controllers/balances');
const userAuth = require('../middleware/userAuth');
const userExist = require('../middleware/userExist');
const merchantValid = require('../middleware/merchantValid');
const balanceValid = require('../middleware/balanceValid');

//api.pointup.io/users
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
router.delete('/', userAuth, userExist, uController.deleteUser/*, bController.userDelete*/);


//Balances

//Get Balances
router.get('/balances', userAuth, userExist, bController.userGetAll);
router.get('/balances/:balanceId', userAuth, userExist, balanceValid, bController.userGetOne);

//Create Balance
router.post('/balances', userAuth, userExist, merchantValid, bController.userCreate);

//Delete Balance
router.delete('/balances/:balanceId', userAuth, userExist, balanceValid, bController.userDeleteOne);

//(Debug)
router.delete('/balances', userAuth, userExist, bController.userDeleteAll);

module.exports = router;
