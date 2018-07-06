const Balance = require('../models/balances');
const Merchant = require('../models/merchants');
const Transaction = require('../models/transactions');
const Hash = require('../models/hashes');

const mongoose = require('mongoose');

const getDiscount = require('../utils/getDiscount');

async function pruneHashes() {
  try {
    let hash = await Hash.find().sort({ balanceId: 1, isActive: 1 }).exec();
    let balance = await Balance.find().exec();

    if (!balance.length) {
      console.log("No balances have hashes!");
    } else {
      var real = false;
      var active = false;
      for (var y = hash.length-1; y >= 0; y--) {
        for (var x = balance.length-1; x >= 0; x--) {
          //console.log((hash[y].balanceId.equals(balance[x]._id)) + " " + balance[x]._id);
          if (balance[x]._id.equals(hash[y].balanceId)) {
            real = true;
            if (balance[x].isActive) {
              active = true;
              break;
            }
            break;
          }
        }
        if (!real) {
          console.log("Hash " + hash[y].hashId + " is not real!");
          //await Hash.remove({_id: hash[y]._id}).exec();
        } else if (!active) {
          console.log("Hash " + hash[y].hashId + " is true to an inactive balance!");
          //await Hash.remove({_id: hash[y]._id}).exec();
        } else {
          console.log("Hash " + hash[y].hashId + " is " + hash[y].isActive + " to " + balance[x]._id);
        }
        real = false;
        active = false;
      }
    }
  } catch (err) {
    console.log(err);
  }
}

async function addFields() {
  try {
    let transaction = await Transaction.find({ discountFactor: { $exists: false }}).exec();

    if (!transaction.length) {
      console.log("No transactions!");
    } else {
      for (var i = 0; i < transaction.length; i++) {
        if (transaction[i].saleMethod == "app") {
          const discount = getDiscount.calculate(transaction[i].amount);
          console.log(transaction[i]._id + " should have a discountFactor of " + discount + "!");
          await transaction[i].update({ $set: { discountFactor: discount } });
        } else {
          console.log(transaction[i]._id + " should have a discountFactor of null!");
          await transaction[i].update({ $set: { discountFactor: null } });
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
}

exports.pruneHashes = pruneHashes;
exports.addFields = addFields;
