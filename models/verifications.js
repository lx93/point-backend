const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const verificationSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number },
  email: { type: String },
  code: { type: Number, required: true },
  createdAt: { type: Date, expires: 300, required: true }
});

//Create a model using the schema
const Verification = mongoose.model('verifications', verificationSchema);

module.exports = Verification;
