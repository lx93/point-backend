// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var balanceSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number, required: true },
  merchantId: { type: String, required: true },
  balance: { type: Number, required: true }
});

// the schema is useless so far
// we need to create a model using it
var Balance = mongoose.model('balances', balanceSchema);

// make this available to our users in our Node applications
module.exports = Balance;
