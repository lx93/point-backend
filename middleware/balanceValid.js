const Balance = require('../models/balances');
const mongoose = require('mongoose');

function balanceValid(req, res, next) {
  var id;
  if (!req.body.balanceId && !req.params.balanceId) {
    console.log('Invalid balanceId!');
    return res.status(422).json({
      message: "Invalid balanceId!"
    });
  }
  else if (req.params.balanceId) {
    id = req.params.balanceId;
  } else {
    id = req.body.balanceId;
  }
  Balance.findOne({ _id: id })
    .exec()
    .then( balance => {
      if (!balance) {
        next();
      } else {
        next();
      }
    })
    .catch( err => {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    });
};

module.exports = balanceValid;
