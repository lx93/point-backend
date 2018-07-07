const readline = require('readline');

const Balance = require('../models/balances');
const Merchant = require('../models/merchants');
const Transaction = require('../models/transactions');
const Hash = require('../models/hashes');

  // readline an id
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


//Set up mongoose connection
const mongoose = require('mongoose');

rl.question("Username: ", (username) => {
  rl.question("Password: ", (password) => {
    const mongoDB =  "mongodb://" + username + ":" + password + "@ds215961.mlab.com:15961/pointdb-test"
    mongoose.connect(mongoDB, { useNewUrlParser: true });
    mongoose.Promise = global.Promise;
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));

    pruneHashes();
    addFields();
    rl.close();
  });
});

async function pruneHashes() {
  try {
    let hash = await Hash.find().sort({ balanceId: 1, isActive: 1 }).exec();
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
          await Hash.remove({_id: hash[y]._id}).exec();
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
    let merchant = await Merchant.find({ discount: { $exists: false }}).exec();

    if (!merchant.length) {
      console.log("No merchant!");
    } else {
      for (var i = 0; i < merchant.length; i++) {
        console.log(merchant[i]._id + " has no discount!");
        //await merchant[i].update({ $set: { discount: true } }).exec();
      }
    }
  } catch (err) {
    console.log(err);
  }
}
