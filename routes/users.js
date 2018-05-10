const express = require('express');
const uController = require('../controllers/users');
const bController = require('../controllers/balances');
const userAuth = require('../middleware/userAuth');
const userExist = require('../middleware/userExist');

//localhost:3000/users
const router = express.Router();

//Users

//Get info
router.get('/', userAuth, userExist, uController.getUser);

//SignUp
router.post('/signup', uController.signUp);

//LogIn
router.post('/login', uController.logIn);

//Update
router.put('/', userAuth, userExist, uController.update)

//DeleteUser
router.delete('/', userAuth, userExist, uController.deleteUser, bController.userDelete);


//Balances

//Get Balances
router.get('/balances', userAuth, userExist, bController.userGet);
router.get('/balances/:balanceId', userAuth, userExist, bController.userGetOne);

//Create Balance
router.post('/balances', userAuth, userExist, bController.userCreate);
router.post('/balances/:merchantId', userAuth, userExist, bController.userCreateFromURL);

//Delete Balance
router.delete('/balances/:balanceId', userAuth, userExist, bController.userDeleteOne);


module.exports = router;
