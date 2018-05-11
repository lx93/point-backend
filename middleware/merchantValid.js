const Merchant = require('../models/merchants');
const mongoose = require('mongoose');

function merchantValid(req, res, next) {
  var id;
  if (!req.body.merchantId && !req.params.merchantId) {
    console.log('Invalid input!');
    return res.status(422).json({
      message: "Invalid input!"
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
        console.log('Invalid input!');
        return res.status(422).json({
          message: "Invalid input!"
        });
      } else {
        next();
      }
    })
    .catch( err => {
      console.log('Invalid input!');
      return res.status(422).json({
        message: "Invalid input!"
      });
    });
};

module.exports = merchantValid;
