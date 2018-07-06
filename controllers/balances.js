const Balance = require('../models/balances');
const Hash = require('../models/hashes');
const Merchant = require('../models/merchants');
const Transaction = require('../models/transactions');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const hashBalance = require('../utils/hashBalance');
const messenger = require('../utils/messenger');
const saveBalance = require('../utils/saveBalance');
const saveHash = require('../utils/saveHash');
const saveTransaction = require('../utils/saveTransaction');
const throwErr = require('../utils/throwErr');
const validator = require('../utils/validator');

//Users

//userGetAll
//GET api.pointup.io/users/balances
/* Retrieve all balances involving this User. */
async function userGetAll(req, res, next) {
  try {
    const user = req.user;      //User
    const validPhone = user.phone;      //Phone number of the User
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
      //Find real and active hashes mentioned in the balances
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
        //Remove that Hash from the list of Hashes
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

//userGetOne
//GET api.pointup.io/users/balances/:merchantId
/* Get a specific balance with this User and Merchant */
async function userGetOne(req, res, next) {
  try {
    const user = req.user;
    const validPhone = user.phone;
    const merchant = req.merchant;
    const validMerchantId = merchant._id;

    let balance = await Balance.findOne({ phone: validPhone, merchantId: validMerchantId, isActive: true }).exec();

    if (!balance) {
      console.log("No balance exists!");
      return res.status(409).json({
        message: "No balance exists!"
      });
    } else {
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      console.log('\n'+balance+'\n');
      return res.status(200).json({
        balanceId: hash.hashId,
        name: merchant.name,
        image: merchant.image,
        phone: user.phone,
        merchantId: merchant._id,
        balance: balance.balance,
        createdAt: balance.createdAt,
        updatedAt: balance.updatedAt
      });
    }
  } catch (err) {

  }
}

//userCreate
//POST api.pointup.io/users/balances/
/* Create a new balance with a specified Merchant. */
async function userCreate(req, res, next) {
  try {
    //If the amount isn't valid
    if (!validator.number(req.body.amount) ) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = parseInt(req.body.amount);     //Balance amount to be issued
    const validPhone = req.user.phone;      //Phone number of the User
    const merchant = req.merchant;      //Merchant
    const validMerchantId = merchant._id      //MerchantId of the Merchant
    const now = new Date;     //Log time

    //Find a balance with this User and Merchant
    let balance = await Balance.findOne({ phone: validPhone, merchantId: validMerchantId }).exec();

    //If no balance exists
    if (!balance) {
      const validBalanceId = new mongoose.Types.ObjectId;     //Create balanceId
      //Create and save balance
      const newBalance = await saveBalance(validBalanceId, validPhone, validMerchantId, 0, now);

      const validHashId = hashBalance(validBalanceId);      //Create hashId
      //Create and save hash
      const newHash = await saveHash(validBalanceId, validHashId);

      //If amount is not 0
      if (validAmount != 0) {
        //Save info
        req.created = true;
        req.balance = newBalance;
        req.hash = newHash;

        //Continue
        next();
      } else {
        //Create a message for the created card
        const text = await messenger.createCard(merchant.name, validAmount, validHashId, validPhone);
        //Notify the User
        await messenger.sendText(res, validPhone, text);

        console.log('Balance created!');
        return res.status(201).json({
          message: "Balance created!",
          balanceId: validHashId
        });
      }
    //If the balance exists but is not active
    } else if (!balance.isActive) {
      //Activate the balance
      await balance.update({ $set: { isActive: true, updatedAt: now }}).exec();

      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      //If amount is not 0
      if (validAmount != 0) {
        //Save info
        req.created = true;
        req.balance = balance;
        req.hash = hash;

        //Continue
        next();
      } else {
        //Create a message for the created card
        const text = await messenger.createCard(merchant.name, validAmount, validHashId, validPhone);
        //Notify the User
        await messenger.sendText(res, validPhone, text);

        console.log('Balance created!');
        return res.status(201).json({
          message: "Balance created!",
          balanceId: hash.hashId
        });
      }
    //Else
    } else {
      /*
      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      console.log('Balance exists!');
      return res.status(409).json({
        message: "Balance exists!",
        balanceId: hash.hashId
      });
      */
      //If amount is not 0
      if (validAmount != 0) {
        //Find a real and active hash of this balance
        let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

        //Save info
        req.balance = balance;
        req.hash = hash;

        //Continue
        next();
      } else {
        console.log('Invalid amount!');
        return res.status(422).json({
          message: "Invalid amount!",
          balanceId: hash.hashId
        });
      }
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//userUpdate
//PUT api.pointup.io/users/balances/
/* Update an existing balance involving this User. */
async function userUpdate(req, res, next) {
  try {
    //If the amount isn't valid
    if (!validator.number(req.body.amount) || (req.body.amount <= 0)) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = parseInt(req.body.amount);     //Amount of the change in balance
    const user = req.user;      //User
    const validPhone = user.phone;      //Phone number of the User
    const balance = req.balance;      //Valid balance
    const hash = req.hash;     //Valid hash
    const merchant = req.merchant ? req.merchant : await Merchant.findOne({_id: balance.merchantId}).exec();      //Merchant
    const validMerchantId = merchant._id      //MerchantId of the Merchant
    const now = new Date;     //Log time

    //If the User owns the balance
    var result = (balance.phone == validPhone);

    if (!result) {
      console.log('Invalid balanceId!');
      return res.status(422).json({
        message: "Invalid balanceId!"
      });
    //Else
    } else {
      const newBalance = (balance.balance + validAmount);      //New balance
      //Set the new balance
      await balance.update({ $set: { balance: newBalance, updatedAt: now } }).exec();

      //Expire hash
      await hash.update({ $set: { isActive: false } }).exec();
      const validHashId = hashBalance(hash.hashId);      //Create hashId
      //Create and save hash
      await saveHash(balance._id, validHashId);

      //Create and save transaction
      await saveTransaction(balance._id, validPhone, balance.merchantId, validAmount, req.discount, "app", now);

      if (req.created) {
        //Create a message for the created card
        const text = await messenger.createCard(merchant.name, newBalance, validHashId, validPhone);
        //Notify the User
        await messenger.sendText(res, validPhone, text);

        console.log('Balance created!');
        return res.status(201).json({
          message: "Balance created!",
          balanceId: validHashId
        });
      } else {
        //Create a message for the created card
        const text = await messenger.updateCard(merchant.name, newBalance, validHashId, validPhone);
        //Notify the User
        await messenger.sendText(res, validPhone, text);

        console.log('Balance updated!');
        return res.status(201).json({
          message: "Balance updated!",
          balanceId: validHashId
        });
      }
    }
  } catch (err) {
    throwErr(res, err);
  }
}

//userRegift
//PUT api.pointup.io/users/balances/regift
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
    } else if(!validator.number(req.body.amount) || (req.body.amount <= 0) ) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = parseInt(req.body.amount);     //Amount to be gifted (Taken from giver, given to receiver)
    const validPhone = req.user.phone;      //Phone number of the User (gift giver)
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
    } else if (validAmount > balance.balance) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    //Else
    } else {
      const validNewBalance = (balance.balance - validAmount);     //User's new balance
      const validMerchantId = balance.merchantId;     //MerchantId of the gifted balance
      //Find a real Merchant
      let merchant = await Merchant.findOne({ _id: validMerchantId }).exec();

      //Update User's balance
      await balance.update({ $set: { balance: validNewBalance, updatedAt: now } }).exec();

      //Expire hash
      await hash.update({ $set: { isActive: false } }).exec();
      var validHashId = hashBalance(hash.hashId);      //Create hashId
      req.gifter = validHashId;     //Saves hashId
      //Create and save hash
      await saveHash(balance._id, validHashId);

      //Create and save transaction
      await saveTransaction(balance._id, validPhone, validMerchantId, validAmount, null, "none", now);

      //Create a message for the updated card
      const text = await messenger.updateCard(merchant.name, validNewBalance, validHashId, validPhone);
      //Notify the User
      await messenger.sendText(res, validPhone, text);

      //Check if recipient has a balance with the Merchant
      balance = await Balance.findOne({ phone: validNewPhone, merchantId: validMerchantId }).exec();

      //If no balance exists
      if (!balance) {
        const validBalanceId = new mongoose.Types.ObjectId;     //Create balanceId
        //Create and save balance
        const newBalance = await saveBalance(validBalanceId, validNewPhone, validMerchantId, validAmount, now);

        validHashId = hashBalance(validBalanceId);      //Create hashId
        //Create and save hash
        await saveHash(validBalanceId, validHashId);

        //Create and save transaction
        await saveTransaction(validBalanceId, validPhone, validMerchantId, validAmount, null, "none", now);

        //Create a message for the created card
        const text = await messenger.createCard(merchant.name, validAmount, validHashId, validNewPhone);
        //Notify the User
        await messenger.sendText(res, validNewPhone, text);

        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!",
          gifter: req.gifter,
          //recipient: validHashId
        });
      //If the balance exists but is inactive (it must have a value of 0)
      } else if (!balance.isActive) {
        //Reactivate and initialize the balance
        await balance.update({ $set: { balance: validAmount, isActive: true, updatedAt: now } }).exec();

        //Find a real and active hash
        hash = await Hash.findOne({ balanceId: balance._id }).exec();

        validHashId = hashBalance(hash.hashId);      //Create hashId
        //Expire hash
        await hash.update({ $set: { isActive: false } }).exec();
        //Create and save hash
        await saveHash(balance._id, validHashId);

        //Create and save transaction
        await saveTransaction(balance._id, validNewPhone, validMerchantId, validAmount, null, "none", now);

        //Create a message for the created card
        const text = await messenger.createCard(merchant.name, validAmount, validHashId, validNewPhone);
        //Notify the User
        await messenger.sendText(res, validNewPhone, text);

        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!",
          gifter: req.gifter,
          //recipient: validHashId
        });
      //Else the balance must exist
      } else {
        const validNewBalance = (balance.balance + validAmount);     //Gift recipient's new balance
        //Add the gift to recipient's balance
        await balance.update({ $set: { balance: validNewBalance, updatedAt: now } }).exec();

        //Find a real and active hash
        hash = await Hash.findOne({ balanceId: balance._id }).exec();

        validHashId = hashBalance(hash.hashId);      //Create hashId
        //Expire hash
        await hash.update({ $set: { isActive: false } }).exec();
        //Create and save hash
        await saveHash(balance._id, validHashId);

        //Create and save transaction
        await saveTransaction(balance._id, validPhone, validMerchantId, validAmount, null, "none", now);

        //Create a message for the updated card
        const text = await messenger.updateCard(merchant.name, validNewBalance, validHashId, validNewPhone);
        //Notify the User
        await messenger.sendText(res, validNewPhone, text);

        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!",
          gifter: req.gifter,
          //recipient: validHashId
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
    const validPhone = req.user.phone;      //Phone number of the User
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
    const validPhone = req.user.phone;      //Phone number of the User
    const balance = req.balance;      //Valid balance
    const now = new Date;     //Log time

    //If the User owns the balance
    var result = (balance.phone == validPhone);

    if (!result) {
      console.log('Invalid balance!');
      return res.status(422).json({
        message: "Invalid balance!"
      });
    } else if (balance.balance != 0) {
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
    const validPhone = req.user.phone;      //Phone number of the User
    //Find transactions with this User
    let transaction = await Transaction.find({ phone: validPhone }).sort({ timestamp: 1}).exec();

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
          saleMethod: transaction[i].saleMethod,
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

//merchantGetAll
//GET api.pointup.io/merchants/balances
/* Retrieve all balances involving this Merchant. */
async function merchantGetAll(req, res, next) {
  try {
    const validMerchantId = req.merchant._id;      //MerchantId of the Merchant
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
      //Find real and active hashes mentioned in the balances
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
    //If the phone isn't valid
    if (!validator.phone(validPhone)) {
      console.log('Invalid phone!');
      return res.status(422).json({
        message: "Invalid phone!"
      });
    //If the amount isn't valid
    } else if (!validator.number(req.body.amount)) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = parseInt(req.body.amount);     //Balance amount to be issued
    const validMerchantId = req.merchant._id;      //MerchantId of the Merchant
    const now = new Date;     //Log time

    //Find a balance with this User and Merchant
    let balance = await Balance.findOne({ phone: validPhone, merchantId: validMerchantId }).exec();

    //If no balance exists
    if (!balance) {
      const validBalanceId = new mongoose.Types.ObjectId;     //Create balanceId
      //Create and save balance
      const newBalance = await saveBalance(validBalanceId, validPhone, validMerchantId, 0, now);

      const validHashId = hashBalance(validBalanceId);      //Create hashId
      //Create and save hash
      const newHash = await saveHash(validBalanceId, validHashId);

      //If amount is not 0
      if (validAmount != 0) {
        //Save info
        req.created = true;
        req.balance = newBalance;
        req.hash = newHash;

        //Continue
        next();
      //Else
      } else {
        //Create a message for the created card
        const text = await messenger.createCard(merchant.name, validAmount, validHashId, validPhone);
        //Notify the User
        await messenger.sendText(res, validPhone, text);

        console.log('Balance created!');
        return res.status(201).json({
          message: "Balance created!",
          balanceId: validHashId
        });
      }
    //If the balance exists but is inactive
    } else if (!balance.isActive) {
      //Activate the balance
      await balance.update({ $set: { isActive: true, updatedAt: now }}).exec();

      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      //If amount is not 0
      if (validAmount != 0) {
        //Save info
        req.created = true;
        req.balance = balance;
        req.hash = hash;

        //Continue
        next();
      //Else
      } else {
        //Create a message for the created card
        const text = await messenger.createCard(merchant.name, validAmount, validHashId, validPhone);
        //Notify the User
        await messenger.sendText(res, validPhone, text);

        console.log('Balance created!');
        return res.status(201).json({
          message: "Balance created!",
          balanceId: hash.hashId
        });
      }
    //Else
    } else {
      /*
      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      console.log('Balance exists!');
      return res.status(409).json({
        message: "Balance exists!",
        balanceId: hash.hashId
      });
      */
      if (validAmount != 0) {
        //Find a real and active hash of this balance
        let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

        //Save info
        req.balance = balance;
        req.hash = hash;

        //Continue
        next();
      } else {
        console.log('Invalid amount!');
        return res.status(409).json({
          message: "Invalid amount!"
        });
      }
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
    //If the amount isn't valid
    if (!validator.number(req.body.amount) || (req.body.amount == 0)) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = parseInt(req.body.amount);     //Amount of the change in balance
    const merchant = req.merchant;      //Merchant
    const validMerchantId = merchant._id;      //MerchantId of the Merchant
    const balance = req.balance;      //Valid balance
    const hash = req.hash;     //Valid hash
    const now = new Date;     //Log time

    //If the Merchant owns the balance
    var result = (balance.merchantId.equals(validMerchantId));

    if (!result) {
      console.log('This Merchant does not own this giftcard!');
      return res.status(422).json({
        message: "This Merchant does not own this giftcard!"
      });
    } else if (validAmount < 0) {
      if (Math.abs(validAmount) > balance.balance) {
        console.log('Insufficient balance!');
        return res.status(422).json({
          message: "Insufficient balance!"
        });
      }
      //Create sale method
      var sale = "redeem";
    }
    //Else
    const newBalance = (balance.balance + validAmount);      //New balance
    //Set the new balance
    await balance.update({ $set: { balance: newBalance, updatedAt: now } }).exec();

    //Expire hash
    await hash.update({ $set: { isActive: false } }).exec();
    const validHashId = hashBalance(hash.hashId);      //Create hashId
    //Create and save hash
    await saveHash(balance._id, validHashId);

    //If no sale method exists
    if (!sale) {
      //Create sale method
      var sale = "direct";
    }
    //Create and save transaction
    await saveTransaction(balance._id, balance.phone, validMerchantId, validAmount, null, sale, now);

    //If the balance is new
    if (req.created) {
      //Create a message for the created card
      const text = await messenger.createCard(merchant.name, newBalance, validHashId, balance.phone);
      //Notify the User
      await messenger.sendText(res, balance.phone, text);

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: validHashId
      });
    //Else
    } else {
      //Create a message for the updated card
      const text = await messenger.updateCard(merchant.name, newBalance, validHashId, balance.phone);
      //Notify the User
      await messenger.sendText(res, balance.phone, text);

      console.log('Balance updated!');
      return res.status(201).json({
        message: "Balance updated!",
        balanceId: validHashId
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//merchantRestore
//PUT api.pointup.io/merchants/restore
/* Reactive inactive balances with this Merchant */
async function merchantRestore(req, res, next) {
  try {
    const validMerchantId = req.merchant._id;      //MerchantId of the Merchant
    const now = new Date;     //Log time

    //Find a real inactive balance with the Merchant with a balance other than 0
    let balance = await Balance.findOne({ merchantId: validMerchantId, isActive: false, balance: { $ne: 0 } }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Merchant has no inactive balances!');
      return res.status(201).json({
        message1: res.message1,
        message2: "Merchant has no inactive balances!"
      });
    //Else
    } else {
      //Reactivate inactive balances
      await Balance.updateMany({ merchantId: validMerchantId, isActive: false, balance: { $ne: 0 } }, { $set: { isActive: true, updatedAt: now } }).exec();

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
    const validMerchantId = req.merchant._id;      //MerchantId of the Merchant
    const now = new Date;     //Log time

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
    const validMerchantId = req.merchant._id;      //MerchantId of the Merchant
    const balance = req.balance;      //Valid balance
    const now = new Date;     //Log time

    //If the Merchant owns the balance
    var result = (balance.merchantId.equals(validMerchantId));

    if (!result) {
      console.log('Invalid balance!');
      return res.status(422).json({
        message: "Invalid balance!"
      });
    } else if (balance.balance != 0) {
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
          saleMethod: transaction[i].saleMethod,
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

//issueBalance
//PUT api.pointup.io/balances/
/* Issue a balance from a specific Merchant to a specified phone number */
async function issueBalance(req, res, next) {
  try {
    const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");     //Phone number of the User
    //If the phone isn't valid
    if (!validator.phone(validPhone)) {
      console.log('Invalid phone!');
      return res.status(422).json({
        message: "Invalid phone!"
      });
    //If the amount isn't valid
    } else if (!validator.number(req.body.amount) || (req.body.amount < 0) ) {
      console.log('Invalid amount!');
      return res.status(422).json({
        message: "Invalid amount!"
      });
    }
    const validAmount = parseInt(req.body.amount);     //Balance amount to be issued
    const merchant = req.merchant;      //Merchant
    const validMerchantId = merchant._id;     //MerchantId of the Merchant
    const now = new Date;     //Log time

    //Find a real balance with this User and Merchant
    var balance = await Balance.findOne({ phone: validPhone, merchantId: merchant._id }).exec();

    //If no balance exists
    if (!balance) {
      const validBalanceId = new mongoose.Types.ObjectId;     //Create balanceId
      //Create and save balance
      await saveBalance(validBalanceId, validPhone, validMerchantId, validAmount, now);

      const validHashId = hashBalance(validBalanceId);      //Create hashId
      //Create and save hash
      await saveHash(validBalanceId, validHashId);

      //If amount is not 0
      if (validAmount != 0) {
        //Create and save transaction
        await saveTransaction(validBalanceId, validPhone, validMerchantId, validAmount, null, "website", now);
      }

      //Create a message for the created card
      const text = await messenger.createCard(merchant.name, validAmount, validHashId, validPhone);
      //Notify the User
      await messenger.sendText(res, validPhone, text);

      console.log('Balance issued!');
      return res.status(201).json({
        message: "Balance issued!",
        balanceId: validHashId
      });
    //If the balance exists but is inactive
    } else if (!balance.isActive) {
      //Activate the balance
      await balance.update({ $set: { balance: validAmount, isActive: true, updatedAt: now }}).exec();

      //Find a real and active hash of this balance
      let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

      var validHashId = hash.hashId;    //HashId of this balance

      //If amount is not 0
      if (validAmount != 0) {
        //Expire hash
        await hash.update({ $set: { isActive: false } }).exec();
        validHashId = hashBalance(hash.hashId);      //Create hashId
        //Create and save hash
        await saveHash(balance._id, validHashId);

        //Create and save transaction
        await saveTransaction(validBalanceId, validPhone, validMerchantId, validAmount, null, "website", now);
      }

      //Create a message for the created card
      const text = await messenger.createCard(merchant.name, validAmount, validHashId, validPhone);
      //Notify the User
      await messenger.sendText(res, validPhone, text);

      console.log('Balance issued!');
      return res.status(201).json({
        message: "Balance issued!",
        balanceId: validHashId
      });
    //Else
    } else {
      //If amount is 0
      if (req.body.amount == 0) {
        console.log('Invalid amount!');
        return res.status(422).json({
          message: "Invalid amount!"
        });
      //Else
      } else {
        const newBalance = (balance.balance + validAmount);      //New balance
        //Set the new balance
        await balance.update({ $set: { balance: newBalance, updatedAt: now } }).exec();

        //Find a real and active hash of this balance
        let hash = await Hash.findOne({ balanceId: balance._id, isActive: true }).exec();

        //Expire hash
        await hash.update({ $set: { isActive: false } }).exec();
        const validHashId = hashBalance(hash.hashId);      //Create hashId
        //Create and save hash
        await saveHash(balance._id, validHashId);

        //Create and save transaction
        await saveTransaction(balance._id, validPhone, balance.merchantId, validAmount, null, "website", now);

        //Create a message for the updated card
        const text = await messenger.updateCard(merchant.name, newBalance, validHashId, validPhone);
        //Notify the User
        await messenger.sendText(res, validPhone, text);

        console.log('Balance issued!');
        return res.status(201).json({
          message: "Balance issued!",
          balanceId: validHashId
        });
      }
    }
  } catch (err) {
    throwErr(res, err);
  }
}

exports.userGetAll = userGetAll;
exports.userGetOne = userGetOne;
exports.userCreate = userCreate;
exports.userUpdate = userUpdate;
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
exports.issueBalance = issueBalance;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
