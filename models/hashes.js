// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var hashSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  balanceId: mongoose.Schema.Types.ObjectId,
  hashId: { type: String, required: true },
  isActive: { type: Boolean, required: true }
});

/* INDEXES (used to speed up queries)
 * db.hashes.createIndex({ iSActive: -1, hashId: 1 })
 */

// the schema is useless so far
// we need to create a model using it
var Hash = mongoose.model('hashes', hashSchema);

// make this available to our users in our Node applications
module.exports = Hash;
