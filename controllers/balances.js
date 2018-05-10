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
          merchantId: balance[0].merchantId,
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

//userCreateFromQR
//POST localhost:3000/users/balances/
function userCreate(req, res, next) {
  const phone = req.userData.phone;
  Balance.find({ userId: uId, merchantId: mId })
    .exec()
    .then( balance => {
      if (!balance.length) {
        const newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: phone,
          merchantId: req.body.merchantId,
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

//merchantCreate
//POST localhost:3000/users/balances/:merchantId
function userCreateFromURL(req, res, next) {
  const phone = req.userData.phone;
  Balance.find({ phone: phone, merchantId: req.params.merchantId })
    .exec()
    .then( balance => {
      if (!balance.length) {
        const newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: phone,
          merchantId: req.params.merchantId,
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
//GET localhost:3000/merchants/balances
function merchantGet(req, res, next) {
  Balance.find({ merchantId: req.merchantData.merchantId })
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
//GET localhost:3000/merchants/balances/:balanceId
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
          merchantId: balance[0].merchantId,
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
//POST localhost:3000/merchants/balances/
function merchantCreate(req, res, next) {
  const id = req.merchantData.merchantId;
  Balance.find({ phone: req.body.phone, merchantId: id })
    .exec()
    .then( balance => {
      if (!balance.length) {
        const newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: req.body.phone,
          merchantId: id,
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

//merchantCreate
//POST localhost:3000/merchants/balances/:phone
function merchantCreateFromURL(req, res, next) {
  const id = req.merchantData.merchantId;
  Balance.find({ phone: req.body.phone, merchantId: id })
    .exec()
    .then( balance => {
      if (!balance.length) {
        const newBalance = new Balance({
          _id: new mongoose.Types.ObjectId,
          phone: req.params.phone,
          merchantId: id,
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

//merchantUpdate
//PUT localhost:3000/merchants/balance
function merchantUpdate(req, res, next) {
  const id = req.merchantData.merchantId;
  Balance.find({ phone: req.body.phone, merchantId: id })
    .exec()
    .then( balance => {
      if (!balance.length) {
        console.log('Balance doesn\'t!');
        return res.status(409).json({
          message: "Balance doesn't exist!"
        });
      } else {
        var newBalance = req.body.balance + req.body.value;
        balance[0].update({ balance: newBalance })
          .exec()
          .then( result => {
            console.log('Balance updated!');
            return res.status(201).json({
              message: "Balance updated!"
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

//merchantDelete
//DELETE localhost:3000/merchants/
function merchantDelete(req, res, next) {
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
          Balance.remove({ merchantId: id })
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
//DELETE localhost:3000/merchants/balances/:balanceId
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
exports.userCreateFromURL = userCreateFromURL;
exports.userDelete = userDelete;
exports.userDeleteOne = userDeleteOne;

exports.merchantGet = merchantGet;
exports.merchantGetOne = merchantGetOne;
exports.merchantCreate = merchantCreate;
exports.merchantCreateFromURL = merchantCreateFromURL;
exports.merchantUpdate = merchantUpdate;
exports.merchantDelete = merchantDelete;
exports.merchantDeleteOne = merchantDeleteOne;
