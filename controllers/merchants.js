const Merchant = require('../models/merchants');
const Balance = require('../models/balances');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//Get Merchant info
//GET localhost:3000/merchants/
function getMerchant(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      console.log('\n'+merchant+'\n');
      return res.status(200).json({
        name: merchant.name,
        email: merchant.email,
        merchantId: merchant._id
      });
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//Sign up
//POST localhost:3000/merchants/signup
function signUp(req, res, next) {

  Merchant.findOne({$or:[{ name: req.body.name }, { email: req.body.email }]})
    .exec()
    .then( merchant => {
      if (!merchant) {
        if (req.body.password) {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                error: err
              });
            }
            var newMerchant = new Merchant({
              _id: new mongoose.Types.ObjectId,
              name: req.body.name,
              email: req.body.email,
              password: hash
            });
            newMerchant
              .save()
              .then( result => {
                console.log('Merchant created!');
                return res.status(201).json({
                  message: "Merchant created!"
                });
              })
              .catch( err => {
                console.log('Invalid input!');
                return res.status(422).json({
                  message: "Invalid input!"
                });
              });
          });
        } else {
          console.log('Invalid input!');
          return res.status(422).json({
            message: "Invalid input!"
          });
        }
      } else {
        console.log('Merchant exists!');
        return res.status(409).json({
          message: "Merchant exists!"
        });
      }
    })
    .catch( err => {
      console.log('Invalid input!');
      return res.status(422).json({
        message: "Invalid input!"
      });
    })
};

//Log in
//POST localhost:3000/merchants/login
function logIn(req, res, next) {
  Merchant.findOne({ email: req.body.email })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Auth failed');
        return res.status(401).json({
          message: 'Auth failed'
        })
      } else {
        bcrypt.compare(req.body.password, merchant.password, (err, result) => {
          if (err) {
            console.log('Auth failed');
            return res.status(401).json({
              message: "Auth failed"
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                email: merchant.email,
                merchantId: merchant._id
              },
              process.env.JWT_KEY,
              {
                  expiresIn: "1y"
              }
            );
            console.log('Auth successful');
            return res.status(201).header('Authorization', token).json({
              message: "Auth successful"
            });
          }
          console.log('Auth failed');
          return res.status(401).json({
            message: "Auth failed"
          });
        });
      }
    })
    .catch( err => {
      console.log('Auth failed');
      return res.status(401).json({
        message: "Auth failed"
      });
    });
};

//Update
//PUT localhost:3000/merchants/name
function updateName(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      if (req.body.name) {
        merchant.update({ name: req.body.name })
          .exec()
          .then( result => {
            console.log('Name changed!');
            return res.status(201).json({
              message: "Name changed!"
            });
          })
          .catch( err => {
            console.log('Invalid input!');
            return res.status(422).json({
              message: "Invalid input!"
            });
          });
      } else {
        console.log('Invalid input!');
        return res.status(422).json({
          message: "Invalid input!"
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

//Update
//PUT localhost:3000/merchants/image
function updateImage(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            error: err
          });
        }
        Merchant.update({ password: hash })
          .exec()
          .then( result => {
            console.log('Password changed!');
            return res.status(201).json({
              message: "Password changed!"
            });
          })
          .catch( err => {
            console.log('Invalid input!');
            return res.status(422).json({
              message: "Invalid input!"
            });
          });
      });
    })
    .catch( err => {
      console.log(err);
      return res.status(500).json({
        error: err
      });
    });
};

//Update
//PUT localhost:3000/merchants/password
function updatePassword(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      if (req.body.password) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: err
            });
          }
          Merchant.update({ password: hash })
            .exec()
            .then( result => {
              console.log('Password changed!');
              return res.status(201).json({
                message: "Password changed!"
              });
            })
            .catch( err => {
              console.log('Invalid input!');
              return res.status(422).json({
                message: "Invalid input!"
              });
            });
        });
      } else {
        console.log('Invalid input!');
        return res.status(422).json({
          message: "Invalid input!"
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

//Delete Merchant
//DELETE localhost:3000/merchants/
function deleteMerchant(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Merchant doesn\'t exist!');
        return res.status(409).json({
          message: "Merchant doesn't exist!"
        });
      } else {
        Merchant.remove({ _id: id })
          .exec()
          .then(result => {
            console.log('Merchant deleted!');
            Balance.find({ merchantId: id })
              .exec()
              .then( balance => {
                if (!balance.length) {
                  return res.status(201).json({
                    message: "Merchant deleted!"
                  });
                } else {
                  next();
                }
              })
              .catch( err => {
                console.log(err);
                return res.status(500).json({
                  error: err
                });
              });
          })
          .catch(err => {
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
    })
};

exports.getMerchant = getMerchant;
exports.signUp = signUp;
exports.logIn = logIn;
exports.updateName = updateName;
exports.updateImage = updateImage;
exports.updatePassword = updatePassword;
exports.deleteMerchant = deleteMerchant;
