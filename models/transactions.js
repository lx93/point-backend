// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var transactionSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number, required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  transaction: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now() }
});

// the schema is useless so far
// we need to create a model using it
var Transaction = mongoose.model('transactions', transactionSchema);

// make this available to our users in our Node applications
module.exports = Transaction;
