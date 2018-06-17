const Balance = require('../models/balances');
const Merchant = require('../models/merchants');
const Transaction = require('../models/transactions');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');
const QRCode = require('qrcode');

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
      var ids = [];     //Array of merchantIds mentioned in the balances
      for (var i = 0; i < balance.length; i++) {
        ids[i] = balance[i].merchantId;
      }
      //Find real and active Merchants mentioned in the balances
      let merchant = await Merchant.find({ _id: { $in: ids }, isActive: true }).exec();

      var balances = [];      //Array of balances
      for (var i = 0; i < balance.length; i++) {
        for (var x = 0; x < merchant.length; x++) {
          //If the Merchant's id is the same as the merchantId in the balance
          if (merchant[x]._id.equals(balance[i].merchantId)) {
            break;
          }
        }
        //Save balance
        balances[i] = {
          balanceId: balance[i]._id,
          name: merchant[x].name,
          image: merchant[x].image,
          phone: balance[i].phone,
          merchantId: balance[i].merchantId,
          balance: balance[i].balance,
          createdAt: balance[i].createdAt,
          updatedAt: balance[i].updatedAt
        };
        //Remove that Merchant from the list of Merchants
        merchant.splice(x,1);
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
//GET api.pointup.io/users/balances/:balanceId
/* Retrieve a specific balance involving this User. */
async function userGetOne(req, res, next) {
  try {
    const validBalanceId = req.params.balanceId;      //Valid balanceId
    //Find a real and active balance
    let balance = await Balance.findOne({ _id: validBalanceId, isActive: true }).exec();

    //Find a real and active Merchant
    let merchant = await Merchant.findOne({ _id: balance.merchantId, isActive: true }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Balance doesn\'t exist!');
      return res.status(409).json({
        message: "Balance doesn't exist!"
      });
    //Else balance must exist
    } else {
      console.log(balance);
      return res.status(200).json({
        balanceId: balance._id,
        name: merchant.name,
        image: merchant.image,
        phone: balance.phone,
        merchantId: balance.merchantId,
        balance: balance.balance,
        createdAt: balance.createdAt,
        updatedAt: balance.updatedAt
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
      //Create balance
      const newBalance = new Balance({
        _id: new mongoose.Types.ObjectId,
        phone: validPhone,
        merchantId: validMerchantId,
        balance: "0.00",
        isActive: true,
        createdAt: new Date,
        updatedAt: new Date
      });
      //Save balance
      await newBalance.save();
      //Create transaction
      const newTransaction = new Transaction({
        _id: new mongoose.Types.ObjectId,
        balanceId: newBalance._id,
        phone: validPhone,
        merchantId: validMerchantId,
        amount: "0.00",
        timestamp: new Date
      });
      //Save transaction
      await newTransaction.save();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: newBalance._id
      });
    //If the balance exists but is not active
    } else if (!balance.isActive) {
      //Activate the balance
      await balance.update({ $set: { isActive: true }}).exec();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: balance._id
      });
    //Else
    } else {
      console.log('Balance exists!');
      return res.status(409).json({
        message: "Balance exists!",
        balanceId: balance._id
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
    const validBalanceId = req.body.balanceId;      //BalanceId of the User's balance
    //Find a real balance with the User
    let balance = await Balance.findOne({ _id: validBalanceId, phone: validPhone}).exec();

    //If no balance exists
    if (!balance || !balance.isActive) {
      console.log('Invalid balance!');
      return res.status(409).json({
        message: "Invalid balance!"
      });
    //If the gifted amount exceeds the User's balance
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
      await balance.update({ $set: { balance: validNewBalance, updatedAt: new Date } }).exec();

      const newValidAmount = "-" + (Number(validAmount)).toFixed(2)     //Gifted amount with "-" in front
      //Create transaction
      const newTransaction = new Transaction({
        _id: new mongoose.Types.ObjectId,
        balanceId: balance._id,
        phone: validPhone,
        merchantId: validMerchantId,
        amount: newValidAmount,
        timestamp: new Date
      });
      //Save transaction
      await newTransaction.save();
      //Check if recipient has a balance with the Merchant
      balance = await Balance.findOne({ phone: validNewPhone, merchantId: validMerchantId }).exec();

      //If no balance exists
      if (!balance) {
        //Create balance
        const newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: validNewPhone,
          merchantId: validMerchantId,
          balance: validAmount,
          isActive: true,
          createdAt: new Date,
          updatedAt: new Date
        });
        //Save balance
        await newBalance.save();
        //Create transaction
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          balanceId: newBalance._id,
          phone: validPhone,
          merchantId: validMerchantId,
          amount: validAmount,
          timestamp: new Date
        });
        //Save transaction
        await newTransaction.save();

        /*TODO--notify user--*/
        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!"
        });
      //If the balance exists but is inactive (it must have a value of 0.00)
      } else if (!balance.isActive) {
        //Reactivate and initialize the balance
        await balance.update({ $set: { balance: validAmount, isActive: true, updatedAt: new Date } }).exec();

        //Create transaction
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          balanceId: balance._id,
          phone: validNewPhone,
          merchantId: validMerchantId,
          amount: validAmount,
          timestamp: new Date
        });
        //Save transaction
        await newTransaction.save()

        /*TODO--notify user--*/
        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!"
        });
      //Else the balance must exist
      } else {
        const validNewBalance = (Number(balance.balance) + Number(validAmount)).toFixed(2);     //Gift recipient's new balance
        //Add the gift to recipient's balance
        await balance.update({ $set: { balance: validNewBalance, updatedAt: new Date } }).exec();

        //Create transaction
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          balanceId: balance._id,
          phone: validPhone,
          merchantId: validMerchantId,
          amount: validAmount,
          timestamp: new Date
        });
        //Save transaction
        await newTransaction.save();

        /*TODO--notify user--*/
        console.log('Balance exchanged!');
        return res.status(201).json({
          message: "Balance exchanged!"
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
    const validBalanceId = req.params.balanceId;      //Valid balanceId
    //Find a real and active balance
    let balance = await Balance.findOne({ _id: validBalanceId, isActive: true }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Balance doesn\'t exist!');
      return res.status(409).json({
        message: "Balance doesn't exist!"
      });
    //If the balance is not 0.00
    } else if (balance.balance != 0.00) {
      console.log('Cannot delete active balance!');
      return res.status(409).json({
        message: "Cannot delete active balance!"
      });
    //Else
    } else {
      //Set balance as inactive
      await balance.update({ $set: { isActive: false, updatedAt: new Date } })

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
      console.log("\n"+transaction+"\n");
      return res.status(200).json({
        transaction
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
      var balances = [];
      for (var i = 0; i < balance.length; i++) {
        balances[i] = {
          balanceId: balance[i]._id,
          phone: balance[i].phone,
          merchantId: balance[i].merchantId,
          balance: balance[i].balance,
          createdAt: balance[i].createdAt,
          updatedAt: balance[i].updatedAt
        }
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

//merchantGetOne
//GET api.pointup.io/merchants/balances/:balanceId
/* Retrieve a specific balance involving this Merchant. */
async function merchantGetOne(req, res, next) {
  try {
    const validBalanceId = req.params.balanceId;      //Valid balanceId
    //Find a real and active balance
    let balance = await Balance.findOne({ _id: validBalanceId, isActive: true }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Balance doesn\'t exist!');
      return res.status(409).json({
        message: "Balance doesn't exist!"
      });
    //Else
    } else {
      console.log(balance);
      return res.status(200).json({
        balanceId: balance._id,
        phone: balance.phone,
        merchantId: balance.merchantId,
        balance: balance.balance,
        createdAt: balance.createdAt,
        updatedAt: balance.updatedAt
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
    //Find a balance with this User and Merchant
    let balance = await Balance.findOne({ phone: validPhone, merchantId: validMerchantId }).exec();

    //If no balance exists
    if (!balance) {
      //Create balance
      const newBalance = new Balance({
        _id: new mongoose.Types.ObjectId,
        phone: validPhone,
        merchantId: validMerchantId,
        balance: validBalance,
        isActive: true,
        createdAt: new Date,
        updatedAt: new Date
      });
      //Save balance
      await newBalance.save();
      //Create transaction
      const newTransaction = new Transaction({
        _id: new mongoose.Types.ObjectId,
        balanceId: newBalance._id,
        phone: validPhone,
        merchantId: validMerchantId,
        amount: validBalance,
        timestamp: new Date
      });
      //Save transaction
      await newTransaction.save();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: newBalance._id
      });
    //If the balance exists but is inactive
    } else if (!balance.isActive) {
      //Activate and set the balance
      await balance.update({ $set: { balance: validBalance, isActive: true }}).exec();

      console.log('Balance created!');
      return res.status(201).json({
        message: "Balance created!",
        balanceId: balance._id
      });
    //Else
    } else {
      console.log('Balance exists!');
      return res.status(409).json({
        message: "Balance exists!",
        balanceId: balance._id
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
    const validBalanceId = req.body.balanceId;      //Valid balanceId
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find a real balance with the Merchant
    let balance = await Balance.findOne({ _id: validBalanceId, merchantId: validMerchantId }).exec();

    //If no balance exists or is inactive
    if (!balance || !balance.isActive) {
      console.log('Balance doesn\'t! exist');
      return res.status(409).json({
        message: "Balance doesn't exist!"
      });
    //If the amount to be deducted is greater than the balance
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
    await balance.update({ $set: { balance: newBalance, updatedAt: new Date } }).exec();
    //Create transaction
    const newTransaction = new Transaction({
      _id: new mongoose.Types.ObjectId,
      balanceId: balance._id,
      phone: balance.phone,
      merchantId: validMerchantId,
      amount: validAmount,
      timestamp: new Date
    });
    //Save transaction
    await newTransaction.save();

    console.log('Balance updated!');
    return res.status(201).json({
      message: "Balance updated!"
    });
  } catch (err) {
    throwErr(res, err);
  }
};

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
      //Set all balances with this Merchant as inactive
      await Balance.updateMany({ merchantId: validMerchantId }, { $set: { isActive: false } }).exec();

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
    const validBalanceId = req.params.balanceId;      //Valid balanceId
    //Find a real and active balance
    let balance = await Balance.findOne({ _id: validBalanceId, isActive: true }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Balance doesn\'t exist!');
      return res.status(409).json({
        message: "Balance doesn't exist!"
      });
    //If the balance is not 0.00
    } else if (balance.balance != 0.00) {
      console.log('Cannot delete active balance!');
      return res.status(409).json({
        message: "Cannot delete active balance!"
      });
    //Else
    } else {
      //Set balance as inactives
      await balance.update({ $set: { isActive: false } }).exec();

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
      console.log("\n"+transaction+"\n");
      return res.status(200).json({
        transaction
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//QR Code

//getQRCode
//GET api.pointup.io/qr/r/:balanceId
/* Generate a QR code of a balanceId. */
async function getQRCode(req, res, next) {
  try {
    const validBalanceId = req.params.balanceId     //Valid balanceId
    //Find a real and active balance
    let balance = await Balance.findOne({ _id: validBalanceId, isActive: true }).exec();

    //If no balance exists
    if (!balance) {
      console.log('Balance doesn\'t exist!');
      return res.status(409).json({
        message: "Balance doesn't exist!"
      });
    //Else
    } else {
      console.log('\n'+balance+'\n');
      var text = {
        balanceId: balance.id,
      };
      text = JSON.stringify(text);
      //Return QR code
      QRCode.toDataURL(text, (err, qrcode) => {
        if (err) throw err;
        return res.status(200).json({
          "qrcode": qrcode,
          "phone": balance.phone,
          "balance": balance.balance
        });
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

exports.userGetAll = userGetAll;
exports.userGetOne = userGetOne;
exports.userCreate = userCreate;
exports.userRegift = userRegift;
exports.userDeleteAll = userDeleteAll;
exports.userDeleteOne = userDeleteOne;
exports.userGetTransactions = userGetTransactions;

exports.merchantGetAll = merchantGetAll;
exports.merchantGetOne = merchantGetOne;
exports.merchantCreate = merchantCreate;
exports.merchantUpdate = merchantUpdate;
exports.merchantDeleteAll = merchantDeleteAll;
exports.merchantDeleteOne = merchantDeleteOne;
exports.merchantGetTransactions = merchantGetTransactions;

exports.getQRCode = getQRCode;
