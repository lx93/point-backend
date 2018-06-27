const Balance = require('../models/balances');
const Merchant = require('../models/merchants');
const Transaction = require('../models/transactions');
const Hash = require('../models/hashes');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');
const hashBalance = require('../utils/hashBalance');

//Users

//userGetAll
//GET api.pointup.io/users/balances
/* Retrieve all balances involving this User. */
async function userGetAll(req, res, next) {
  try {
    const validPhone = req.userData.phone;      //Phone number of the User
    //Find real and active balances of this User
    let balance = await Balance.find({ phone: validPhone, isActive: true }).exec();

    //If no balances exist
    if (!balance.length) {
      console.log('User has no balances!');
      return res.status(409).json({
        message: "User has no balances!"
      });
    // Else balances must exist
    } else {
      var balanceIds = [];     //Array of balanceIds mentioned in the balances
      for (var i = 0; i < balance.length; i++) {
        balanceIds[i] = balance[i]._id;
      }
      //Find real and active balanceIds mentioned in the balances
      let hash = await Hash.find({ balanceId: { $in: balanceIds }, isActive: true }).exec();

      var merchantIds = [];     //Array of merchantIds mentioned in the balances
      for (var i = 0; i < balance.length; i++) {
        merchantIds[i] = balance[i].merchantId;
      }
      //Find real and active Merchants mentioned in the balances
      let merchant = await Merchant.find({ _id: { $in: merchantIds }, isActive: true }).exec();

      var balances = [];      //Array of balances
      for (var i = 0; i < balance.length; i++) {
        for (var x = 0; x < hash.length; x++) {
          //If the hash's balanceId is the same as the _id in the balance
          if (hash[x].balanceId.equals(balance[i]._id)) {
            break;
          }
        }
        for (var y = 0; y < merchant.length; y++) {
          //If the Merchant's id is the same as the merchantId in the balance
          if (merchant[y]._id.equals(balance[i].merchantId)) {
            break;
          }
        }
        //Save balance
        balances[i] = {
          balanceId: hash[x].hashId,
          name: merchant[y].name,
          image: merchant[y].image,
          phone: balance[i].phone,
          merchantId: balance[i].merchantId,
          balance: balance[i].balance,
          createdAt: balance[i].createdAt,
          updatedAt: balance[i].updatedAt
        };
        //Remove that Merchant from the list of Merchants
        hash.splice(x,1);
        //Remove that Merchant from the list of Merchants
        merchant.splice(y,1);
      }
      console.log("\n"+JSON.stringify(balances, ",", " ")+"\n");
      return res.status(200).json({
        balances
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//userCreate
//POST api.pointup.io/users/balances/
/* Create a new balance of 0.00 with a specified Merchant. */
async function userCreate(req, res, next) {
  try {
    const validPhone = req.userData.phone;      //Phone number of the User
    const validMerchantId = req.body.merchantId;      //MerchantId of the Merchant
    //Find a balance with this User and Merchant
    let balance = await Balance.findOne({ phone: validPhone, merchantId: validMerchantId }).exec();

    //If no balance exists
    if (!balance) {
      const now = new Date;     //Log time
      const mongoId = new mongoose.Types.ObjectId;     //Create balanceId
      //Create balance
      const newBalance = new Balance({
        _id: mongoId,
        phone: validPhone,
        merchantId: validMerchantId,
        balance: "0.00",
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
      //Save balance
      await newBalance.save();

      const validHashId = hashBalance(mongoId);      //Create hashId
      //Create hash
      var newHash = new Hash({
        _id: new mongoose.Types.ObjectId,
        balanceId: newBalance._id,
        hashId: validHashId,
        isActive: true
      });
      //Save hash
      await newHash.save();

      //Create transaction
      const newTransaction = new Transaction({
        _id: new mongoose.Types.ObjectId,
        balanceId: newBalance._id,
        phone: validPhone,
        merchantId: validMerchantId,
        amount: "0.00",
        timestamp: now
      });
      //Save transaction
      await newTransaction.save();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: newHash.hashId
      });
    //If the balance exists but is not active
    } else if (!balance.isActive) {
      const now = new Date;     //Log time
      //Activate the balance
      await balance.update({ $set: { isActive: true, updatedAt: now }}).exec();

      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: hash.hashId
      });
    //Else
    } else {
      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      console.log('Balance exists!');
      return res.status(409).json({
        message: "Balance exists!",
        balanceId: hash.hashId
      });
    }
  } catch (err) {
    throwErr(res, next);
  }
};

//userRegift
//PUT api.pointup.io/users/balances/
/* Deduct a specified amount from a balance this User holds and give it to a specified phone number */
async function userRegift(req, res, next) {
  try {
    const validNewPhone = String(req.body.newPhone).replace(/[^0-9]/g, "");     //Phone number of gift recipient
    //If the new phone isn't valid
    if (!validator.phone(validNewPhone)) {
      console.log('Invalid phone!');
      return res.status(422).json({
        message: "Invalid phone!"
      });
    //If the amount isn't valid
    } else if(!validator.number(req.body.amount) || (req.body.amount < 0) ) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = Number(req.body.amount).toFixed(2);     //Amount to be gifted (Taken from giver, given to receiver)
    const validPhone = req.userData.phone;      //Phone number of the User (gift giver)
    var balance = req.balance;      //The User's balance
    var hash = req.hash;     //The User's hash
    const now = new Date;     //Log time

    //If the User owns the balance
    var result = (balance.phone == validPhone);

    if (!result) {
      console.log('Invalid balance!');
      return res.status(422).json({
        message: "Invalid balance!"
      });
    } else if (Number(validAmount) > Number(balance.balance)) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    //Else
    } else {
      const validNewBalance = (Number(balance.balance) - Number(validAmount)).toFixed(2);     //User's new balance
      const validMerchantId = balance.merchantId;     //MerchantId of the gifted balance

      //Update User's balance
      await balance.update({ $set: { balance: validNewBalance, updatedAt: now } }).exec();

      //Expire hash
      await hash.update({ $set: { isActive: false } }).exec();
      var validHashId = hashBalance(hash.hashId);      //Create hashId
      req.gifter = validHashId;     //Saves hashId
      //Create hash
      var newHash = new Hash({
        _id: new mongoose.Types.ObjectId,
        balanceId: balance._id,
        hashId: validHashId,
        isActive: true
      });
      //Save hash
      await newHash.save();

      const newValidAmount = "-" + (Number(validAmount)).toFixed(2)     //Gifted amount with "-" in front
      //Create transaction
      const newTransaction = new Transaction({
        _id: new mongoose.Types.ObjectId,
        balanceId: balance._id,
        phone: validPhone,
        merchantId: validMerchantId,
        amount: newValidAmount,
        timestamp: now
      });
      //Save transaction
      await newTransaction.save();
      //Check if recipient has a balance with the Merchant
      balance = await Balance.findOne({ phone: validNewPhone, merchantId: validMerchantId }).exec();

      //If no balance exists
      if (!balance) {
        const mongoId = new mongoose.Types.ObjectId;     //Create balanceId
        //Create balance
        const newBalance = new Balance({
          _id: mongoId,
          phone: validNewPhone,
          merchantId: validMerchantId,
          balance: validAmount,
          isActive: true,
          createdAt: now,
          updatedAt: now
        });
        //Save balance
        await newBalance.save();

        validHashId = hashBalance(mongoId);      //Create hashId
        //Create hash
        var newHash = new Hash({
          _id: new mongoose.Types.ObjectId,
          balanceId: newBalance._id,
          hashId: validHashId,
          isActive: true
        });
        //Save hash
        await newHash.save();

        //Create transaction
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          balanceId: newBalance._id,
          phone: validPhone,
          merchantId: validMerchantId,
          amount: validAmount,
          timestamp: now
        });
        //Save transaction
        await newTransaction.save();

        /*TODO--notify user--*/
        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!",
          gifter: req.gifter,
          recipient: validHashId
        });
      //If the balance exists but is inactive (it must have a value of 0.00)
      } else if (!balance.isActive) {
        //Reactivate and initialize the balance
        await balance.update({ $set: { balance: validAmount, isActive: true, updatedAt: now } }).exec();

        validHashId = hashBalance(balance._id);      //Create hashId
        //Create hash
        var newHash = new Hash({
          _id: new mongoose.Types.ObjectId,
          balanceId: balance._id,
          hashId: validHashId,
          isActive: true
        });
        //Save hash
        await newHash.save();

        //Create transaction
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          balanceId: balance._id,
          phone: validNewPhone,
          merchantId: validMerchantId,
          amount: validAmount,
          timestamp: now
        });
        //Save transaction
        await newTransaction.save()

        /*TODO--notify user--*/
        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!",
          gifter: req.gifter,
          recipient: validHashId
        });
      //Else the balance must exist
      } else {
        const validNewBalance = (Number(balance.balance) + Number(validAmount)).toFixed(2);     //Gift recipient's new balance
        //Add the gift to recipient's balance
        await balance.update({ $set: { balance: validNewBalance, updatedAt: now } }).exec();

        validHashId = hashBalance(balance._id);      //Create hashId
        //Create hash
        var newHash = new Hash({
          _id: new mongoose.Types.ObjectId,
          balanceId: balance._id,
          hashId: validHashId,
          isActive: true
        });
        //Save hash
        await newHash.save();

        //Create transaction
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          balanceId: balance._id,
          phone: validPhone,
          merchantId: validMerchantId,
          amount: validAmount,
          timestamp: now
        });
        //Save transaction
        await newTransaction.save();

        /*TODO--notify user--*/
        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!",
          gifter: req.gifter,
          recipient: validHashId
        });
      }
    }
  } catch (err) {
    throwErr(res, err);
  }
}

//userDeleteAll DEBUG ONLY
//DELETE api.pointup.io/users
/* Set the isActive value to false on all balances involving this User.  */
async function userDeleteAll(req, res, next) {
  try {
    const validPhone = req.userData.phone;      //Phone number of the User
    //Find a real and active balance with this User
    let balance = await Balance.findOne({ phone: validPhone, isActive: true }).exec();

    //If no balance exists
    if (!balance) {
      console.log('User has no balances!');
      return res.status(409).json({
        message: "User has no balances!"
      });
    //Else
    } else {
      //Set all balances with this User as inactive
      await Balance.updateMany({ phone: validPhone }, { $set: { isActive: false } }).exec();

      console.log('Balances deleted!');
      return res.status(201).json({
        message: "Balances deleted!"
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//userDeleteOne
//DELETE api.pointup.io/users/balances/:balanceId
/* Delete a specific balance involving this User. This balance must be empty with 0.00. */
async function userDeleteOne(req, res, next) {
  try {
    const validPhone = req.userData.phone;      //Phone number of the User
    const balance = req.balance;      //Valid balance
    const now = new Date;     //Log time

    var result = (balance.phone == validPhone);

    if (!result) {
      console.log('Invalid balance!');
      return res.status(422).json({
        message: "Invalid balance!"
      });
    } else if (balance.balance != 0.00) {
      console.log('Cannot delete active balance!');
      return res.status(409).json({
        message: "Cannot delete active balance!"
      });
    } else {
      //Set balance as inactive
      await balance.update({ $set: { isActive: false, updatedAt: now } })

      console.log('Balance deleted!');
      return res.status(201).json({
        message: "Balance deleted!"
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//userGetTransactions
//GET api.pointup.io/users/transactions
/* View all transactions to the balances your User Point account holds. */
async function userGetTransactions(req, res, next) {
  try {
    const validPhone = req.userData.phone;      //Phone number of the User
    //Find transactions with this User
    let transaction = await Transaction.find({ phone: validPhone }).sort({ timestampe: 1}).exec();

    //If no transactions exist
    if (!transaction.length) {
      console.log('User has no transactions!');
      return res.status(409).json({
        message: "User has no transactions!"
      });
    //Else
    } else {
      var transactions = [];
      for (var i = 0; i < transaction.length; i++) {
        transactions[i] = {
          transactionId: transaction[i]._id,
          phone: transaction[i].phone,
          merchantId: transaction[i].merchantId,
          amount: transaction[i].amount,
          timestamp: transaction[i].timestamp
        }
      }
      console.log("\n"+JSON.stringify(transactions, ",", " ")+"\n");
      return res.status(200).json({
        transactions
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
}

//Merchants

//merchantGetOne
//GET api.pointup.io/merchants/balances
/* Retrieve all balances involving this Merchant. */
async function merchantGetAll(req, res, next) {
  try {
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find all balances with this Merchant
    let balance = await Balance.find({ merchantId: validMerchantId, isActive: true }).exec();

    //If no balances exists
    if (!balance.length) {
      console.log('Merchant has no balances!');
      return res.status(409).json({
        message: "Merchant has no balances!"
      });
    //Else
    } else {
      var ids = [];     //Array of balanceIds mentioned in the balances
      for (var i = 0; i < balance.length; i++) {
        ids[i] = balance[i]._id;
      }
      //Find real and active Merchants mentioned in the balances
      let hash = await Hash.find({ balanceId: { $in: ids }, isActive: true }).exec();

      var balances = [];      //Array of balances
      for (var i = 0; i < balance.length; i++) {
        for (var x = 0; x < hash.length; x++) {
          //If the hash's balanceId is the same as the _id in the balance
          if (hash[x].balanceId.equals(balance[i]._id)) {
            break;
          }
        }
        balances[i] = {
          balanceId: hash[x].hashId,
          phone: balance[i].phone,
          merchantId: balance[i].merchantId,
          balance: balance[i].balance,
          createdAt: balance[i].createdAt,
          updatedAt: balance[i].updatedAt
        }
        //Remove that Merchant from the list of Merchants
        hash.splice(x,1);
      }
      console.log("\n"+JSON.stringify(balances, ",", " ")+"\n");
      return res.status(200).json({
        balances
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//merchantCreate
//POST api.pointup.io/merchants/balances/
/* Create a new balance with a specified User. */
async function merchantCreate(req, res, next) {
  try {
    const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");     //Phone number of the User
    if (!validator.phone(validPhone)) {
      console.log('Invalid phone!');
      return res.status(422).json({
        message: "Invalid phone!"
      });
    } else if(!validator.number(req.body.balance) || (req.body.balance < 0) ) {
      console.log('Invalid balance!');
      return res.status(422).json({
        message: "Invalid balance!"
      });
    }
    const validBalance = Number(req.body.balance).toFixed(2);     //Balance amount to be issued
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    const now = new Date;     //Log time
    //Find a balance with this User and Merchant
    let balance = await Balance.findOne({ phone: validPhone, merchantId: validMerchantId }).exec();

    //If no balance exists
    if (!balance) {
      const mongoId = new mongoose.Types.ObjectId;     //Create balanceId
      //Create balance
      const newBalance = new Balance({
        _id: mongoId,
        phone: validPhone,
        merchantId: validMerchantId,
        balance: validBalance,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
      //Save balance
      await newBalance.save();

      const validHashId = hashBalance(mongoId);      //Create hashId
      //Create hash
      const newHash = new Hash({
        _id: new mongoose.Types.ObjectId,
        balanceId: newBalance._id,
        hashId: validHashId,
        isActive: true
      });
      //Save hash
      await newHash.save();

      //Create transaction
      const newTransaction = new Transaction({
        _id: new mongoose.Types.ObjectId,
        balanceId: newBalance._id,
        phone: validPhone,
        merchantId: validMerchantId,
        amount: validBalance,
        timestamp: now
      });
      //Save transaction
      await newTransaction.save();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: newHash.hashId
      });
    //If the balance exists but is inactive
    } else if (!balance.isActive) {
      //Activate and set the balance
      await balance.update({ $set: { balance: validBalance, isActive: true }}).exec();

      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: hash.hashId
      });
    //Else
    } else {
      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      console.log('Balance exists!');
      return res.status(409).json({
        message: "Balance exists!",
        balanceId: hash.hashId
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//merchantUpdate
//PUT api.pointup.io/merchants/balances/
/* Update an existing balance. */
async function merchantUpdate(req, res, next) {
  try {
    if (!validator.number(req.body.amount)) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = Number(req.body.amount).toFixed(2);     //Amount of the change in balance
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    const balance = req.balance;      //Valid balance
    const hash = req.hash;     //Valid hash
    const now = new Date;     //Log time

    var result = (balance.merchantId == validMerchantId);

    if (!result) {
      console.log('Invalid balance!');
      return res.status(422).json({
        message: "Invalid balance!"
      });
    } else if (Number(validAmount) < 0) {
      if (Math.abs(Number(validAmount)) > Number(balance.balance)) {
        console.log('Insufficient balance!');
        return res.status(422).json({
          message: "Insufficient balance!"
        });
      }
    }
    //Else
    const newBalance = (Number(balance.balance) + Number(validAmount)).toFixed(2);      //New balance
    //Set the new balance
    await balance.update({ $set: { balance: newBalance, updatedAt: now } }).exec();

    //Expire hash
    await hash.update({ $set: { isActive: false } }).exec();
    const validHashId = hashBalance(hash.hashId);      //Create hashId
    //Create hash
    const newHash = new Hash({
      _id: new mongoose.Types.ObjectId,
      balanceId: balance._id,
      hashId: validHashId,
      isActive: true
    });
    //Save hash
    await newHash.save();

    //Create transaction
    const newTransaction = new Transaction({
      _id: new mongoose.Types.ObjectId,
      balanceId: balance._id,
      phone: balance.phone,
      merchantId: validMerchantId,
      amount: validAmount,
      timestamp: now
    });
    //Save transaction
    await newTransaction.save();

    console.log('Balance updated!');
    return res.status(201).json({
      message: "Balance updated!",
      balanceId: validHashId
    });
  } catch (err) {
    throwErr(res, err);
  }
};

//merchantRestore
//PUT api.pointup.io/merchants/restore
/* Reactive inactive balances with this Merchant */
async function merchantRestore(req, res, next) {
  try {
    const validMerchantId = req.merchantId;      //MerchantId of the Merchant
    //Find a real inactive balance with the Merchant with a balance other than 0.00
    let balance = await Balance.findOne({ merchantId: validMerchantId, isActive: false, balance: { $ne: '0.00' } }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Merchant has no inactive balances!');
      return res.status(201).json({
        message1: res.message1,
        message2: "Merchant has no inactive balances!"
      });
    //Else
    } else {
      const now = new Date;     //Log time
      //Reactivate inactive balances
      await Balance.updateMany({ merchantId: validMerchantId, isActive: false, balance: { $ne: '0.00' } }, { $set: { isActive: true, updatedAt: now } }).exec();

      console.log('Balances restored!');
      return res.status(201).json({
        message1: res.message1,
        message2: "Balances restored!"
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
}

//merchantDeleteAll
//DELETE api.pointup.io/merchants/
/* Delete all balances involving this Merchant. */
async function merchantDeleteAll(req, res, next) {
  try {
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find a real and active balance with the Merchant
    let balance = await Balance.findOne({ merchantId: validMerchantId, isActive: true }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Merchant has no balances!');
      return res.status(201).json({
        message1: res.message1,
        message2: "Merchant has no balances!"
      });
    //Else
    } else {
      const now = new Date;     //Log time
      //Set all balances with this Merchant as inactive
      await Balance.updateMany({ merchantId: validMerchantId }, { $set: { isActive: false, updatedAt: now } }).exec();

      /*TO-DO--notify all users associated that this merchant is no longer supported by our service.*/
      console.log('Balances deleted!');
      return res.status(201).json({
        message1: res.message1,
        message2: "Balances deleted!"
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//merchantDeleteOne
//DELETE api.pointup.io/merchants/balances/:balanceId
/* Delete a specific balance involving this Merchant. This balance must be empty with 0.00. */
async function merchantDeleteOne(req, res, next) {
  try {
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    const balance = req.balance;      //Valid balance
    const now = new Date;     //Log time

    var result = (balance.merchantId == validMerchantId);

    if (!result) {
      console.log('Invalid balance!');
      return res.status(422).json({
        message: "Invalid balance!"
      });
    } else if (balance.balance != 0.00) {
      console.log('Cannot delete active balance!');
      return res.status(409).json({
        message: "Cannot delete active balance!"
      });
    //Else
    } else {
      //Set balance as inactives
      await balance.update({ $set: { isActive: false, updatedAt: now } }).exec();

      console.log('Balance deleted!');
      return res.status(201).json({
        message: "Balance deleted!"
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//merchantGetTransactions
//GET api.pointup.io/merchants/transactions
/* Retrieve all transactions involving this Merchant. */
async function merchantGetTransactions(req, res, next) {
  try {
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find transactions with this Merchant
    let transaction = await Transaction.find({ merchantId: validMerchantId }).sort({ timestamp: 1 }).exec();

    //If no transactions exist
    if (!transaction.length) {
      console.log('Merchant has no transactions!');
      return res.status(409).json({
        message: "Merchant has no transactions!"
      });
    //Else
    } else {
      var transactions = [];
      for (var i = 0; i < transaction.length; i++) {
        transactions[i] = {
          transactionId: transaction[i]._id,
          phone: transaction[i].phone,
          merchantId: transaction[i].merchantId,
          amount: transaction[i].amount,
          timestamp: transaction[i].timestamp
        }
      }
      console.log("\n"+JSON.stringify(transactions, ",", " ")+"\n");
      return res.status(200).json({
        transactions
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//Balances

//getBalance
//GET api.pointup.io/balances/:balanceId
/* Retrieve a specific balance. */
async function getBalance(req, res, next) {
  try {
    const balance = req.balance;      //Valid balance
    const hash = req.hash;     //Valid hash

    //Find a real and active Merchant
    let merchant = await Merchant.findOne({ _id: balance.merchantId, isActive: true }).exec();

    console.log(balance);
    return res.status(200).json({
      balanceId: hash.hashId,
      name: merchant.name,
      image: merchant.image,
      phone: balance.phone,
      merchantId: balance.merchantId,
      balance: balance.balance,
      createdAt: balance.createdAt,
      updatedAt: balance.updatedAt
    });
  } catch (err) {
    throwErr(res, err);
  }
};

exports.userGetAll = userGetAll;
exports.userCreate = userCreate;
exports.userRegift = userRegift;
exports.userDeleteAll = userDeleteAll;
exports.userDeleteOne = userDeleteOne;
exports.userGetTransactions = userGetTransactions;

exports.merchantGetAll = merchantGetAll;
exports.merchantCreate = merchantCreate;
exports.merchantUpdate = merchantUpdate;
exports.merchantRestore = merchantRestore;
exports.merchantDeleteAll = merchantDeleteAll;
exports.merchantDeleteOne = merchantDeleteOne;
exports.merchantGetTransactions = merchantGetTransactions;

exports.getBalance = getBalance;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
