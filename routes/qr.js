const express = require('express');
const bController = require('../controllers/balances');
const balanceValid = require('../middleware/balanceValid');

//localhost:3000/qr
const router = express.Router();

//QR

//Display QR
router.get('/:balanceId', (req, res, next) => {
  res.render('QR', { title: 'QR Code' });
});

//Get QRCode
router.get('/', balanceValid, bController.getQRCode);

module.exports = router;
