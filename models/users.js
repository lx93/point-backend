// grab the things we need
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: Number, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: new Date },
  createdAt: { type: Date, default: new Date },
  updatedAt: { type: Date, default: new Date }
});

/* INDEXES (used to speed up queries)
 * db.users.createIndex({ isActive: -1, _id: 1 })
 */

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('users', userSchema);

// make this available to our users in our Node applications
module.exports = User;
