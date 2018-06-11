const Balance = require('../models/balances');
const mongoose = require('mongoose');

function balanceValid(req, res, next) {
  var validBalanceId;
  if (!req.body.balanceId && !req.params.balanceId) {
    console.log('Invalid balanceId!');
    return res.status(422).json({
      message: "Invalid balanceId!"
    });
  }
  else if (req.params.balanceId) {
    validBalanceId = req.params.balanceId;
  } else {
    validBalanceId = req.body.balanceId;
  }
  Balance.findOne({ _id: validBalanceId, isActive: true })
    .exec()
    .then( balance => {
      next();
    })
    .catch( err => {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    });
};

module.exports = balanceValid;
