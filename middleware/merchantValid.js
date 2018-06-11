const Merchant = require('../models/merchants');
const mongoose = require('mongoose');

function merchantValid(req, res, next) {
  var validMerchantId;
  if (!req.body.merchantId && !req.params.merchantId) {
    console.log('Invalid merchantId!');
    return res.status(422).json({
      message: "Invalid merchantId!"
    });
  }
  else if (req.params.merchantId) {
    validMerchantId = req.params.merchantId;
  } else {
    validMerchantId = req.body.merchantId;
  }
  Merchant.findOne({ _id: validMerchantId, isActive: true })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Invalid merchantId!');
        return res.status(422).json({
          message: "Invalid merchantId!"
        });
      } else {
        next();
      }
    })
    .catch( err => {
      console.log('Invalid merchantId!');
      return res.status(422).json({
        message: "Invalid merchantId!"
      });
    });
};

module.exports = merchantValid;
