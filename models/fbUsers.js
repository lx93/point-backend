const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const fbUserSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  phone: { type: Number, required: true, unique: true },
  fbId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: Date }
});

//Create a model using the schema
const FBUser = mongoose.model('fbusers', fbUserSchema);

module.exports = FBUser;
