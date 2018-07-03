const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const merchantSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, required: true },
  isActive: { type: Boolean, required: true },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true }
});

/* INDEXES (used to speed up queries)
 * db.merchants.createIndex({ isActive: -1, _id: 1 })
 * db.merchants.createIndex({ _id: 1, merchantId: 1 })
 */

//Create a model using the schema
const Merchant = mongoose.model('merchants', merchantSchema);

module.exports = Merchant;
