const Balance = require('../models/balances');
const mongoose = require('mongoose');

async function balanceValid(req, res, next) {
  try {
    var validHashId;
    //If there is no balanceId field
    if (!req.body.balanceId && !req.params.balanceId) {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    }
    //If the balanceId is in the params
    else if (req.params.balanceId) {
      validHashId = req.params.balanceId;
    //Else
    } else {
      validHashId = req.body.balanceId;
    }
    //Find a real and active balance
    let balance = await Balance.findOne({ hashId: validHashId, isActive: true }).exec();

    if (!balance) {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    } else {
      //Save the actual balanceId
      req.balanceId = balance._id;
      //Continue
      next();
    }
  } catch (err) {
    console.log('Invalid balanceId!');
    return res.status(422).json({
      message: "Invalid balanceId!"
    });
  }
};

module.exports = balanceValid;
