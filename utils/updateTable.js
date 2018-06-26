const Balance = require('../models/balances');
const Merchant = require('../models/merchants');
const Hash = require('../models/hashes');

module.exports = async () => {
  let balance = Balance.find({ hashId: { $exist: true } });

  if (!balance.length) {
    console.log("No balances have hashes!");
  } else {
    for (var x = 0; x < balance.length; x++) {
      var newHash = new Hash({
        _id: new mongoose.Types.ObjectId,
        balanceId: balance[x]._id,
        hashId: balance[x].hashId,
        isActive: true
      });
      await newHash.save();

      balance[x].update({ $unset: { hashId: "" } });
      console.log(balance[x].merchantId + " " + balance[x].phone + " -> Moved hash " + newHash.hashId);
    }
  }
}
