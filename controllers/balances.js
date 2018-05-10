const Balance = require('../models/balances');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//Users

//userGet
//GET localhost:3000/users/balances
function userGet(req, res, next) {
  Balance.find({ phone: req.userData.phone })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('User has no balances!');
        return res.status(409).json({
          message: "User has no balances!"
        });
      } else {
        console.log(balance);
        return res.status(200).json({
          balance
        });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//userGetOne
//GET localhost:3000/users/balances/:balanceId
function userGetOne(req, res, next) {
  const id = req.params.balanceId;
  Balance.find({ _id: id })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
        console.log(balance);
        return res.status(200).json({
          _id: balance[0]._id,
          phone: balance[0].phone,
          email: balance[0].email,
          balance: balance[0].balance
        });
      }
    })
    .catch( err => {
      console.log('Balance doesn\'t exist!');
      return res.status(409).json({
        message: "Balance doesn't exist!"
      });
    });
};

//userCreate
//POST localhost:3000/users/balances
function userCreate(req, res, next) {
  Balance.find({ phone: req.userData.phone, email: req.body.email })
    .exec()
    .then( balance => {
      if (!balance.length) {
        var newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: req.userData.phone,
          email: req.body.email,
          balance: 0
        });
        newBalance
          .save()
          .then( result => {
            console.log('Balance created!');
            return res.status(201).json({
              message: "Balance created!"
            });
          })
          .catch( err => {
            console.log(err);
            return res.status(500).json({
              error: err
            });
          });
      } else {
        console.log('Balance exists!');
        return res.status(409).json({
          message: "Balance exists!"
        });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//userDelete
//DELETE localhost:3000/users
function userDelete(req, res, next) {
  Balance.find({ phone: req.userData.phone })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('User has no balances!');
        return res.status(409).json({
          message: "User has no balances!"
        });
      } else {
          Balance.remove({ phone: req.userData.phone })
            .exec()
            .then ( result => {
              console.log('Balances deleted!');
              return res.status(201).json({
                message: "User and Balances deleted!"
              });
            })
            .catch( err => {
              console.log(err);
              return res.status(500).json({
                error: err
              });
            });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//userDeleteOne
//DELETE localhost:3000/users/balances/:balanceId
function userDeleteOne(req, res, next) {
  const id = req.params.balanceId;
  Balance.find({ _id: id })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
          Balance.remove({ _id: id })
            .exec()
            .then ( result => {
              console.log('Balance deleted!');
              return res.status(201).json({
                message: "Balance deleted!"
              });
            })
            .catch( err => {
              console.log(err);
              return res.status(500).json({
                error: err
              });
            });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};


//Merchants

//merchantGet
//GET localhost:3000/balances/merchants
function merchantGet(req, res, next) {
  Balance.find({ email: req.merchantData.email })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Merchant has no balances!');
        return res.status(409).json({
          message: "Merchant has no balances!"
        });
      } else {
        console.log(balance);
        return res.status(200).json({
          balance
        });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//merchantGetOne
//GET localhost:3000/balances/merchants/:balanceId
function merchantGetOne(req, res, next) {
  const id = req.params.balanceId
  Balance.find({ _id: id })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
        console.log(balance);
        return res.status(200).json({
          _id: balance[0]._id,
          phone: balance[0].phone,
          email: balance[0].email,
          balance: balance[0].balance
        });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//merchantCreate
//POST localhost:3000/balances/merchants
function merchantCreate(req, res, next) {
  Balance.find({ phone: req.body.phone, email: req.merchantData.email })
    .exec()
    .then( balance => {
      if (!balance.length) {
        var newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: req.body.phone,
          email: req.merchantData.email,
          balance: req.body.balance
        });
        newBalance
          .save()
          .then( result => {
            console.log('Balance created!');
            return res.status(201).json({
              message: "Balance created!"
            });
          })
          .catch( err => {
            console.log(err);
            return res.status(500).json({
              error: err
            });
          });
      } else {
        console.log('Balance exists!');
        return res.status(409).json({
          message: "Balance exists!"
        });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//merchantDelete
//DELETE localhost:3000/merchants
function merchantDelete(req, res, next) {
  Balance.find({ email: req.merchantData.email })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Merchant has no balances!');
        return res.status(409).json({
          message: "Merchant has no balances!"
        });
      } else {
          Balance.remove({ email: req.merchantData.email })
            .exec()
            .then ( result => {
              console.log('Balances deleted!');
              return res.status(201).json({
                message: "Merchant and Balances deleted!"
              });
            })
            .catch( err => {
              console.log(err);
              return res.status(500).json({
                error: err
              });
            });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//merchantDeleteOne
//DELETE localhost:3000/balances/merchants/:balanceId
function merchantDeleteOne(req, res, next) {
  const id = req.params.balanceId;
  Balance.find({ _id: id })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Balance doesn\'t exist!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
          Balance.remove({ _id: id })
            .exec()
            .then ( result => {
              console.log('Balance deleted!');
              return res.status(201).json({
                message: "Balance deleted!"
              });
            })
            .catch( err => {
              console.log(err);
              return res.status(500).json({
                error: err
              });
            });
      }
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};


exports.userGet = userGet;
exports.userGetOne = userGetOne;
exports.userCreate = userCreate;
exports.userDelete = userDelete;
exports.userDeleteOne = userDeleteOne;

exports.merchantGet = merchantGet;
exports.merchantGetOne = merchantGetOne;
exports.merchantCreate = merchantCreate;
exports.merchantDelete = merchantDelete;
exports.merchantDeleteOne = merchantDeleteOne;
