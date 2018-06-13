// grab the things we need
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
var verificationSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number },
  email: { type: String },
  code: { type: Number, default: true },
  createdAt: { type: Date, expires: 300, default: new Date }
});

// the schema is useless so far
// we need to create a model using it
var Verification = mongoose.model('verifications', verificationSchema);

// make this available to our users in our Node applications
module.exports = Verification;
