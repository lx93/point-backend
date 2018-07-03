const Merchant = require('../models/merchants');

const mongoose = require('mongoose');

async function merchantExist(req, res, next) {
  try {
    const validMerchantId = req.merchantData.merchantId;
    //Find a real and active Merchant
    let merchant = await Merchant.findOne({ _id: validMerchantId, isActive: true }).exec();

    //If no Merchant exists
    if (!merchant) {
      console.log('Auth failed');
      return res.status(401).json({
        message: "Auth failed"
      });
    //Else
    } else {
      //Save the Merchant
      req.merchant = merchant;
      //Continue
      next();
    }
  } catch (err) {
    console.log('Auth failed');
    return res.status(401).json({
      message: "Auth failed"
    });
  }
};

module.exports = merchantExist;
