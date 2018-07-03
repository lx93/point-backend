const Merchant = require('../models/merchants');

const mongoose = require('mongoose');

async function merchantValid(req, res, next) {
  try {
    var validMerchantId;
    //If there is no merchantId field
    if (!req.body.merchantId && !req.params.merchantId) {
      console.log('Invalid merchantId!');
      return res.status(422).json({
        message: "Invalid merchantId!"
      });
    }
    //If the merchantId is in the params
    else if (req.params.merchantId) {
      validMerchantId = req.params.merchantId;
    //Else
    } else {
      validMerchantId = req.body.merchantId;
    }
    //Find a real and active Merchant
    let merchant = await Merchant.findOne({ _id: validMerchantId, isActive: true }).exec();

    //If no Merchant exists
    if (!merchant) {
      console.log('Invalid merchantId!');
      return res.status(422).json({
        message: "Invalid merchantId!"
      });
    //Else
    } else {
      //Save the Merchant
      req.merchant = merchant;
      //Continue
      next();
    }
  } catch (err) {
    console.log('Invalid merchantId!');
    return res.status(422).json({
      message: "Invalid merchantId!"
    });
  }
};

module.exports = merchantValid;
