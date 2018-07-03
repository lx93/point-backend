const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const transactionSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  balanceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  phone: { type: Number, required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: String, required: true },
  timestamp: { type: Date, required: true }
});

/* INDEXES (used to speed up queries)
 * db.transactions.createIndex({ timestamp: 1 })
 */

//Create a model using the schema
const Transaction = mongoose.model('transactions', transactionSchema);

module.exports = Transaction;
