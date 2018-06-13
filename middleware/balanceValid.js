const Balance = require('../models/balances');
const mongoose = require('mongoose');

async function balanceValid(req, res, next) {
  try {
    var validBalanceId;
    //If there is no balanceId field
    if (!req.body.balanceId && !req.params.balanceId) {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    }
    //If the balanceId is in the params
    else if (req.params.balanceId) {
      validBalanceId = req.params.balanceId;
    //Else
    } else {
      validBalanceId = req.body.balanceId;
    }
    //Find a real and active balance
    var balance = await Balance.findOne({ _id: validBalanceId, isActive: true }).exec()

    //Continue
    next();
  } catch (err) {
    console.log('Invalid balanceId!');
    return res.status(422).json({
      message: "Invalid balanceId!"
    });
  }
};

module.exports = balanceValid;
