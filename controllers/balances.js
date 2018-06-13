const Balance = require('../models/balances');
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
function userGetAll(req, res, next) {
  const validPhone = req.userData.phone;
  Balance.find({ phone: validPhone })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('User has no balances!');
        return res.status(409).json({
          message: "User has no balances!"
        });
      } else {
        console.log("\n"+balance+"\n");
        return res.status(200).json({
          balance
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//userGetOne
//GET api.pointup.io/users/balances/:balanceId
function userGetOne(req, res, next) {
  const validBalanceId = req.params.balanceId;
  Balance.findOne({ _id: validBalanceId, isActive: true })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
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
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//userCreate
//POST api.pointup.io/users/balances/
function userCreate(req, res, next) {
  const validPhone = req.userData.phone;
  const validMerchantId = req.body.merchantId;
  Balance.findOne({ phone: validPhone, merchantId: validMerchantId })
    .exec()
    .then( balance => {
      if (!balance) {
        const newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: validPhone,
          merchantId: validMerchantId,
          balance: "0.00"
        });
        newBalance
          .save()
          .then( result => {
            const newTransaction = new Transaction({
              _id: new mongoose.Types.ObjectId,
              balanceId: newBalance._id,
              phone: validPhone,
              merchantId: validMerchantId,
              amount: "0.00",
              timestamp: new Date
            });
            newTransaction
              .save()
              .then( result => {
                console.log('Balance created!');
                return res.status(201).json({
                  message: "Balance created!",
                  balanceId: newBalance._id
                });
              })
              .catch( err => {
                throwErr(err)
              });
          })
          .catch( err => {
            throwErr(err);
          });
      } else if (!balance.isActive) {
        balance.update({ $set: { isActive: true }})
          .exec()
          .then( result => {
            console.log('Balance created!');
            return res.status(201).json({
              message: "Balance created!",
              balanceId: balance._id
            });
          })
          .catch( err => {
            throwErr(res, err);
          });
      } else {
        console.log('Balance exists!');
        return res.status(409).json({
          message: "Balance exists!",
          balanceId: balance._id
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//userDeleteAll DEBUG ONLY
//DELETE api.pointup.io/users
function userDeleteAll(req, res, next) {
  const validPhone = req.userData.phone;
  Balance.findOne({ phone: validPhone, isActive: true })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('User has no balances!');
        return res.status(409).json({
          message: "User has no balances!"
        });
      } else {
          Balance.updateMany({ phone: validPhone }, { $set: { isActive: false } })
            .exec()
            .then ( result => {
              console.log('Balances deleted!');
              return res.status(201).json({
                message: "Balances deleted!"
              });
            })
            .catch( err => {
              throwErr(res, err);
            });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//userDeleteOne
//DELETE api.pointup.io/users/balances/:balanceId
function userDeleteOne(req, res, next) {
  const validBalanceId = req.params.balanceId;
  Balance.findOne({ _id: validBalanceId, isActive: true })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else if (balance.balance != 0.00) {
        console.log('Cannot delete active balance!');
        return res.status(409).json({
          message: "Cannot delete active balance!"
        });
      } else {
          balance.update({ $set: { isActive: false } })
            .exec()
            .then( result => {
              console.log('Balance deleted!');
              return res.status(201).json({
                message: "Balance deleted!"
              });
            })
            .catch( err => {
              throwErr(res, err);
            });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//userGetTransactions
//GET api.pointup.io/users/transactions
function userGetTransactions(req, res, next) {
  const validPhone = req.userData.phone;
  Transaction.find({ phone: validPhone })
    .sort({ timestamp: 1 })
    .exec()
    .then( transaction => {
      if (!transaction.length) {
        console.log('User has no transactions!');
        return res.status(409).json({
          message: "User has no transactions!"
        });
      } else {
        console.log("\n"+transaction+"\n");
        return res.status(200).json({
          transaction
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
}

//Merchants

//merchantGetOne
//GET api.pointup.io/merchants/balances
function merchantGetAll(req, res, next) {
  const validMerchantId = req.merchantData.merchantId;
  Balance.find({ merchantId: validMerchantId })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Merchant has no balances!');
        return res.status(409).json({
          message: "Merchant has no balances!"
        });
      } else {
        console.log('\n'+balance+'\n');
        return res.status(200).json({
          balance
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//merchantGetOne
//GET api.pointup.io/merchants/balances/:balanceId
function merchantGetOne(req, res, next) {
  const validBalanceId = req.params.balanceId;
  Balance.findOne({ _id: validBalanceId, isActive: true })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
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
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//merchantCreate
//POST api.pointup.io/merchants/balances/
function merchantCreate(req, res, next) {
  const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");
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
  const validBalance = Number(req.body.balance).toFixed(2);
  const validMerchantId = req.merchantData.merchantId;
  Balance.findOne({ phone: validPhone, merchantId: validMerchantId })
    .exec()
    .then( balance => {
      if (!balance) {
        const newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: validPhone,
          merchantId: validMerchantId,
          balance: validBalance
        });
        newBalance
          .save()
          .then( result => {
            const newTransaction = new Transaction({
              _id: new mongoose.Types.ObjectId,
              balanceId: newBalance._id,
              phone: validPhone,
              merchantId: validMerchantId,
              amount: validBalance,
              timestamp: new Date
            });
            newTransaction
              .save()
              .then( result => {
                console.log('Balance created!');
                return res.status(201).json({
                  message: "Balance created!",
                  balanceId: newBalance._id
                });
              })
              .catch( err => {
                throwErr(res, err);
              });
          })
          .catch( err => {
            throwErr(res, err);
          });
      } else if (!balance.isActive) {
        balance.update({ $set: { balance: validBalance, isActive: true }})
          .exec()
          .then( result => {
            console.log('Balance created!');
            return res.status(201).json({
              message: "Balance created!",
              balanceId: newBalance._id
            });
          })
          .catch( err => {
            throwErr(res, err);
          });
      } else {
        console.log('Balance exists!');
        return res.status(409).json({
          message: "Balance exists!",
          balanceId: balance._id
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//merchantUpdate
//PUT api.pointup.io/merchants/balances/
function merchantUpdate(req, res, next) {
  if (!validator.number(req.body.amount)) {
    console.log('Invalid amount!');
    return res.status(422).json({
      message: "Invalid amount!"
    });
  }
  const validAmount = Number(req.body.amount).toFixed(2);
  const validBalanceId = req.body.balanceId;
  const validMerchantId = req.merchantData.merchantId;
  Balance.findOne({ _id: validBalanceId, merchantId: validMerchantId })
    .exec()
    .then( balance => {
      if (!balance || !balance.isActive) {
        console.log('Balance doesn\'t! exist');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else if (Math.abs(Number(validAmount)) > Number(balance.balance)) {
        console.log('Invalid amount!');
        return res.status(422).json({
          message: "Invalid amount!"
        });
      } else {
        var newBalance = (Number(balance.balance) + Number(validAmount)).toFixed(2);
        balance.update({ $set: { balance: newBalance, updatedAt: new Date } })
          .exec()
          .then( result => {
            const newTransaction = new Transaction({
              _id: new mongoose.Types.ObjectId,
              balanceId: balance.balanceId,
              phone: balance.phone,
              merchantId: validMerchantId,
              amount: validAmount,
              timestamp: new Date
            });
            newTransaction
              .save()
              .then( result => {
                console.log('Balance updated!');
                return res.status(201).json({
                  message: "Balance updated!"
                });
              })
              .catch( err => {
                throwErr(res, err);
              });
          })
          .catch( err => {
            throwErr(res, err);
          });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//merchantDeleteAll
//DELETE api.pointup.io/merchants/
function merchantDeleteAll(req, res, next) {
  const validMerchantId = req.merchantData.merchantId;
  Balance.findOne({ merchantId: validMerchantId, isActive: true })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Merchant has no balances!');
        return res.status(201).json({
          message1: res.message1,
          message2: "Merchant has no balances!"
        });
      } else {
          Balance.updateMany({ merchantId: validMerchantId }, { $set: { isActive: false } })
            .exec()
            .then( result => {
              /*TO-DO--notify all users associated that this merchant is no longer supported by our service.*/
              console.log('Balances deleted!');
              return res.status(201).json({
                message1: res.message1,
                message2: "Balances deleted!"
              });
            })
            .catch( err => {
              throwErr(res, err);
            });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//merchantDeleteOne
//DELETE api.pointup.io/merchants/balances/:balanceId
function merchantDeleteOne(req, res, next) {
  const validBalanceId = req.params.balanceId;
  Balance.findOne({ _id: validBalanceId, isActive: true })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else if (balance.balance != 0.00) {
        console.log('Cannot delete active balance!');
        return res.status(409).json({
          message: "Cannot delete active balance!"
        });
      } else {
          balance.update({ $set: { isActive: false } })
            .exec()
            .then( result => {
              console.log('Balance deleted!');
              return res.status(201).json({
                message: "Balance deleted!"
              });
            })
            .catch( err => {
              throwErr(res, err);
            });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//merchantGetTransactions
//GET api.pointup.io/merchants/transactions
function merchantGetTransactions(req, res, next) {
  const validMerchantId = req.merchantData.merchantId;
  Transaction.find({ merchantId: validMerchantId })
    .sort({ timestamp: 1 })
    .exec()
    .then( transaction => {
      if (!transaction.length) {
        console.log('Merchant has no transactions!');
        return res.status(409).json({
          message: "Merchant has no transactions!"
        });
      } else {
        console.log("\n"+transaction+"\n");
        return res.status(200).json({
          transaction
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
}


//getQRCode
//GET api.pointup.io/qr/r/:balanceId
function getQRCode(req, res, next) {
  const validBalanceId = req.params.balanceId
  Balance.findOne({ _id: validBalanceId, isActive: true })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
        console.log('\n'+balance+'\n');
        var text = {
          balanceId: balance.id,
        };
        text = JSON.stringify(text);
        QRCode.toDataURL(text, (err, qrcode) => {
          if (err) throw err;
          return res.status(200).json({
            "qrcode": qrcode,
            "phone": balance.phone,
            "balance": balance.balance
          });
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

exports.userGetAll = userGetAll;
exports.userGetOne = userGetOne;
exports.userCreate = userCreate;
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
