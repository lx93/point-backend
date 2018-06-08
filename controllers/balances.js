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
  Balance.find({ phone: req.userData.phone })
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
  Balance.findOne({ _id: req.params.balanceId })
    .exec()
    .then( balance => {
      console.log(balance);
      return res.status(200).json({
        balanceId: balance._id,
        phone: balance.phone,
        merchantId: balance.merchantId,
        balance: balance.balance
      });
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//userCreate
//POST api.pointup.io/users/balances/
function userCreate(req, res, next) {
  const phone = req.userData.phone;
  Balance.findOne({ phone: phone, merchantId: req.body.merchantId })
    .exec()
    .then( balance => {
      if (!balance) {
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          phone: phone,
          merchantId: req.body.merchantId,
          transaction: 0,
          timestamp: new Date
        });
        newTransaction
          .save()
          .then( result => {
            const newBalance = new Balance({
              _id: new mongoose.Types.ObjectId,
              phone: phone,
              merchantId: req.body.merchantId,
              balance: 0
            });
            newBalance
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

//userDeleteAll
//DELETE api.pointup.io/users
function userDeleteAll(req, res, next) {
  const phone = req.userData.phone;
  Balance.findOne({ phone: phone })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('User has no balances!');
        return res.status(409).json({
          message: "User has no balances!"
        });
      } else {
          Balance.remove({ phone: phone })
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
  const id = req.params.balanceId;
  Balance.findOne({ _id: id })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
          Balance.remove({ _id: id })
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
  const phone = req.userData.phone;
  Transaction.find({ phone: phone }).sort({timestamp:1})
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
  const id = req.merchantData.merchantId;
  Balance.find({ merchantId: id })
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

//merchantGetFromURL
//GET api.pointup.io/merchants/balances/:balanceId
function merchantGetOne(req, res, next) {
  Balance.findOne({ _id: req.params.balanceId })
    .exec()
    .then( balance => {
      console.log(balance);
      return res.status(200).json({
        balanceId: balance._id,
        phone: balance.phone,
        merchantId: balance.merchantId,
        balance: balance.balance
      });
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//merchantCreate
//POST api.pointup.io/merchants/balances/
function merchantCreate(req, res, next) {
  const phone = String(req.body.phone).replace(/[^0-9]/g, "");
  if (!validator.phone(phone)) {
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
  const id = req.merchantData.merchantId;
  Balance.findOne({ phone: phone, merchantId: id })
    .exec()
    .then( balance => {
      if (!balance) {
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          phone: phone,
          merchantId: id,
          transaction: req.body.balance,
          timestamp: new Date
        });
        newTransaction
          .save()
          .then( result => {
            const newBalance = new Balance({
              _id: new mongoose.Types.ObjectId,
              phone: phone,
              merchantId: id,
              balance: req.body.balance
            });
            newBalance
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
  if (!validator.number(req.body.value)) {
    console.log('Invalid value!');
    return res.status(422).json({
      message: "Invalid value!"
    });
  }
  const id = req.merchantData.merchantId;
  Balance.findOne({ _id: req.body.balanceId, merchantId: id })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t! exist');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else if (req.body.value > balance.balance) {
        console.log('Invalid value!');
        return res.status(422).json({
          message: "Invalid value!"
        });
      } else {
        const newTransaction = new Transaction({
          _id: new mongoose.Types.ObjectId,
          phone: balance.phone,
          merchantId: id,
          transaction: req.body.value,
          timestamp: new Date
        });
        newTransaction
          .save()
          .then( result => {
            var newBalance = balance.balance + req.body.value;
            balance.update({ $set: { balance: newBalance } })
              .exec()
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
  const id = req.merchantData.merchantId;
  Balance.findOne({ merchantId: id })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Merchant has no balances!');
        return res.status(409).json({
          message: "Merchant has no balances!"
        });
      } else {
          Balance.remove({ merchantId: id })
            .exec()
            .then( result => {
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

//merchantDeleteOne
//DELETE api.pointup.io/merchants/balances/:balanceId
function merchantDeleteOne(req, res, next) {
  const id = req.params.balanceId;
  Balance.findOne({ _id: id })
    .exec()
    .then( balance => {
      if (!balance) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
          Balance.remove({ _id: id })
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
  const id = req.merchantData.merchantId;
  Transaction.find({ merchantId: id }).sort({timestamp:1})
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
  const id = req.params.balanceId
  Balance.findOne({ _id: id })
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
