// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CounterSchema = Schema

// create a schema
var merchantSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: new Date },
  createdAt: { type: Date, default: new Date },
  updatedAt: { type: Date, default: new Date }
});

/* INDEXES (used to speed up queries)
 * db.merchants.createIndex({ isActive: -1, _id: 1 })
 * db.merchants.createIndex({ _id: 1, merchantId: 1 })
 */

// the schema is useless so far
// we need to create a model using it
var Merchant = mongoose.model('merchants', merchantSchema);

// make this available to our users in our Node applications
module.exports = Merchant;
