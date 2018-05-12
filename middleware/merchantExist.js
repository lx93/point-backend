const Merchant = require('../models/merchants');
const mongoose = require('mongoose');

function merchantExist(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Auth failed');
        return res.status(401).json({
          message: "Auth failed"
        });
      } else {
        next();
      }
    })
    .catch( err => {
      console.log('Auth failed');
      return res.status(401).json({
        message: "Auth failed"
      });
    });
};

module.exports = merchantExist;
