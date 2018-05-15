const Merchant = require('../models/merchants');
const mongoose = require('mongoose');

function merchantValid(req, res, next) {
  var id;
  if (!req.body.merchantId && !req.params.merchantId) {
    console.log('Invalid merchantId!');
    return res.status(422).json({
      message: "Invalid merchantId!"
    });
  }
  else if (req.params.merchantId) {
    id = req.params.merchantId;
  } else {
    id = req.body.merchantId;
  }
  Merchant.findOne({ _id: id })
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
