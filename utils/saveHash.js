const Hash = require('../models/hashes');

const mongoose = require('mongoose');

module.exports = async (balanceId, hashId) => {
  //Create hash
  const newHash = new Hash({
    _id: new mongoose.Types.ObjectId,
    balanceId: balanceId,
    hashId: hashId,
    isActive: true
  });
  //Save transaction
  await newHash.save();
  return newHash;
}
