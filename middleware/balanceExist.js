const Balance = require('../models/balances');
const Hash = require('../models/hashes');
const mongoose = require('mongoose');

async function balanceExist(req, res, next) {
  try {
    var validHashId;
    //If there is no balanceId field
    if (!req.body.balanceId && !req.params.balanceId) {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    //If the balanceId is in the params
    } else if (req.params.balanceId) {
      validHashId = req.params.balanceId;
    //Else
    } else {
      validHashId = req.body.balanceId;
    }
    //Find a real hash
    let hash = await Hash.findOne({ hashId: validHashId }).exec();

    //If no hash exists
    if (!hash) {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    //If hash exists but is inactive
    } else if (!hash.isActive) {
      console.log('Balance expired!');
      return res.status(202).json({
        message: "Balance expired!"
      });
    //Else
    } else {
      const validBalanceId = hash.balanceId;      //Valid balanceId
      //Save the actual hashId
      req.hash = hash;
      //Find a real and active balance
      let balance = await Balance.findOne({ _id: validBalanceId, isActive: true }).exec();

      //If no balance exists
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      //Else
      } else {
        //Save the actual balanceId
        req.balance = balance;
        //Continue
        next();
      }
    }
  } catch (err) {
    console.log('Invalid balanceId!');
    return res.status(422).json({
      message: "Invalid balanceId!"
    });
  }
};

module.exports = balanceExist;
