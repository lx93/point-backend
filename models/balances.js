// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var balanceSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number, required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  balance: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: new Date },
  updatedAt: { type: Date, default: new Date }
});

/* INDEXES (used to speed up queries)
 * db.balances.createIndex({  isActive: -1, _id: 1 })
 */

// the schema is useless so far
// we need to create a model using it
var Balance = mongoose.model('balances', balanceSchema);

// make this available to our users in our Node applications
module.exports = Balance;
