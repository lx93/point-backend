const express = require('express');
const bController = require('../controllers/balances');
const userAuth = require('../middleware/userAuth');
const merchantAuth = require('../middleware/merchantAuth');
const userExist = require('../middleware/userExist');
const merchantExist = require('../middleware/merchantExist');

const router = express.Router();

router.get('/users', userAuth, userExist, bController.userGet);
router.get('/merchants', merchantAuth, merchantExist, bController.merchantGet);

router.get('/users/:balanceId', userAuth, userExist, bController.userGetOne);
router.get('/merchants/:balanceId', merchantAuth, merchantExist, bController.merchantGetOne);

//Create Balance
router.post('/users', userAuth, userExist, bController.userCreate);
router.post('/merchants', merchantAuth, merchantExist, bController.merchantCreate);

//Delete Balance
router.delete('/users/:balanceId', userAuth, userExist, bController.userDeleteOne);
router.delete('/merchants/:balanceId', merchantAuth, merchantExist, bController.merchantDeleteOne);

module.exports = router;
