const Balance = require('../models/balances');

const mongoose = require('mongoose');

module.exports = async (balanceId, phone, merchantId, balance, now) => {
  //Create transaction
  const newBalance = new Balance({
    _id: balanceId,
    phone: phone,
    merchantId: merchantId,
    balance: balance,
    isActive: true,
    createdAt: now,
    updatedAt: now
  });
  //Save transaction
  await newTransaction.save();
  return newBalance;
}
