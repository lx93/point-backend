const Transaction = require('../models/transactions');

const mongoose = require('mongoose');

module.exports = async (balanceId, phone, merchantId, amount, discountFactor, saleMethod, timestamp) => {
  //Create transaction
  const newTransaction = new Transaction({
    _id: new mongoose.Types.ObjectId,
    balanceId: balanceId,
    phone: phone,
    merchantId: merchantId,
    amount: amount,
    discountFactor: discountFactor,
    saleMethod: saleMethod,
    timestamp: timestamp
  });
  //Save transaction
  await newTransaction.save();
}
