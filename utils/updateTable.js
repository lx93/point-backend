const Balance = require('../models/balances');
const Merchant = require('../models/merchants');
const Transaction = require('../models/transactions');
const Hash = require('../models/hashes');

const mongoose = require('mongoose');

async function pruneHashes() {
  try {
    let hash = await Hash.find().exec();
    let balance = await Balance.find().exec();

    if (!balance.length) {
      console.log("No balances have hashes!");
    } else {
      var real = false;
      for (var y = hash.length-1; y >= 0; y--) {
        for (var x = balance.length-1; x >= 0; x--) {
          //console.log((hash[y].balanceId.equals(balance[x]._id)) + " " + balance[x]._id);
          if (balance[x]._id.equals(hash[y].balanceId)) {
            real = true;
            break;
          }
        }
        if (!real) {
          console.log("Hash " + hash[y].hashId + " is not real!");
          //await Hash.remove({_id: hash[y]._id}).exec();
        } else {
          console.log("Hash " + hash[y].hashId + " is " + hash[y].isActive + " to " + balance[x]._id);
        }
        real = false;
      }
    }
  } catch (err) {
    console.log(err);
  }
}

async function addFields() {
  try {
    let transaction = await Transaction.find({ saleMethod: { $exists: false }}).exec();

    if (!transaction.length) {
      console.log("No transactions!");
    } else {
      for (var i = 0; i < transaction.length; i++) {
        console.log("Transaction " + transaction[i]._id + " has no sale method!");
        await transaction[i].update({ $set: { saleMethod: "direct" } });
      }
    }
  } catch (err) {
    console.log(err);
  }
}

exports.pruneHashes = pruneHashes;
exports.addFields = addFields;
