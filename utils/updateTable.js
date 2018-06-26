const Balance = require('../models/balances');
const Merchant = require('../models/merchants');
const Hash = require('../models/hashes');
const mongoose = require('mongoose');

module.exports = async () => {
  let balance = await Balance.find({ hashId: { $exists: true } }).exec();

  if (!balance.length) {
    console.log("No balances have hashes!");
  } else {
    for (var x = 0; x < balance.length; x++) {
      var newHash = new Hash({
        _id: new mongoose.Types.ObjectId,
        balanceId: balance[x]._id,
        hashId: balance[x].hashId,
        isActive: true
      });
      await newHash.save();

      await balance[x].update({ $unset: { hashId: "" } }).exec();
      console.log(balance[x].merchantId + " " + balance[x].phone + " -> Moved hash " + newHash.hashId);
    }
  }
}
