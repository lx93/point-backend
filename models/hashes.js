const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const hashSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  balanceId: mongoose.Schema.Types.ObjectId,
  hashId: { type: String, required: true },
  isActive: { type: Boolean, required: true }
});

/* INDEXES (used to speed up queries)
 * db.hashes.createIndex({ isActive: -1, balanceId: 1, hashId: 1 })
 */

//Create a model using the schema
const Hash = mongoose.model('hashes', hashSchema);

module.exports = Hash;
