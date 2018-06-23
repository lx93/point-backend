// grab the things we need
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
var fbUserSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number, required: true, unique: true },
  fbId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: Date },
});

// the schema is useless so far
// we need to create a model using it
var FBUser = mongoose.model('fbusers', fbUserSchema);

// make this available to our users in our Node applications
module.exports = FBUser;
