// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var transactionSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  balanceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  phone: { type: Number, required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: String, required: true },
  timestamp: { type: Date, default: new Date }
});

/* INDEXES (used to speed up queries)
 * db.balances.createIndex({ timestamp: 1 })
 */

// the schema is useless so far
// we need to create a model using it
var Transaction = mongoose.model('transactions', transactionSchema);

// make this available to our users in our Node applications
module.exports = Transaction;
