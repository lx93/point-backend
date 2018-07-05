const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const balanceSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number, required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  balance: { type: Number, required: true },
  hashId: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true }
});

/* INDEXES (used to speed up queries)
 * db.balances.createIndex({ isActive: -1, _id: 1 })
 * db.balances.createIndex({ merchantId: 1, phone: 1 })
 */

//Create a model using the schema
const Balance = mongoose.model('balances', balanceSchema);

module.exports = Balance;
