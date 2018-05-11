// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var merchantSchema = new Schema({
  merchantId: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// the schema is useless so far
// we need to create a model using it
var Merchant = mongoose.model('merchants', merchantSchema);

// make this available to our users in our Node applications
module.exports = Merchant;
