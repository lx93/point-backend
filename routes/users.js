const express = require('express');
const uController = require('../controllers/users');
const bController = require('../controllers/balances');
const userAuth = require('../middleware/userAuth');
const userExist = require('../middleware/userExist');

const router = express.Router();

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


module.exports = router;
