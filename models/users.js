// grab the things we need
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number, required: true, unique: true },
  password: { type: String, required: true }
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('users', userSchema);

// make this available to our users in our Node applications
module.exports = User;
