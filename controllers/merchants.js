const Merchant = require('../models/merchants');
const Balance = require('../models/balances');
const Verification = require('../models/verifications');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');
const RNG = require('../utils/RNG');
const emailer = require('../utils/emailer');


//Get Merchant info
//GET api.pointup.io/merchants/
function getMerchant(req, res, next) {
  const validMerchantId = req.merchantData.merchantId;
  Merchant.findOne({ _id: validMerchantId, isActive: true })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Merchant doesn\'t exist!');
        return res.status(409).json({
          message: "Merchant doesn't exist!"
        });
      } else {
        console.log('\n'+merchant+'\n');
        return res.status(200).json({
          name: merchant.name,
          email: merchant.email,
          image: merchant.image,
          merchantId: merchant._id,
          lastLoginAt: merchant.lastLoginAt
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Verify
//POST api.pointup.io/merchants/verify
function verify(req, res, next) {
  const validEmail = req.body.email;
  Merchant.findOne({ email: validEmail })
    .exec()
    .then( merchant => {
      var x = RNG();
      var newVerification = new Verification({
        _id: new mongoose.Types.ObjectId,
        email: validEmail,
        code: x
      });
      newVerification
        .save()
        .then( result => {
          emailer.sendEmail(validEmail, "Pointup Verification code: " + x);
          console.log('Code sent!');
          return res.status(201).json({
            message: "Code sent!"
          });
        })
        .catch( err => {
          throwErr(res, err);
        });
    })
    .catch( err => {
      throwErr(res, err);
    })
};

//Sign up
//POST api.pointup.io/merchants/signup
function signUp(req, res, next) {
  if (!validator.string(req.body.name)) {
    console.log('Invalid name!');
    return res.status(422).json({
      message: "Invalid name!"
    });
  } else if (!validator.email(req.body.email)) {
    console.log('Invalid email!');
    return res.status(422).json({
      message: "Invalid email!"
    });
  } else if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const validName = req.body.name;
  const validEmail = req.body.email;
  const validPassword = req.body.password;
  const validCode = req.body.code;
  Verification.findOne({ email: validEmail, code: validCode })
    .exec()
    .then( verification => {
      if (!verification) {
        /*console.log('Auth failed');
        return res.status(401).json({
          message: 'Auth failed'
        });*/
        Merchant.findOne({ $or:[{ name: validName }, { email: validEmail } ]} )
          .exec()
          .then( merchant => {
            if (!merchant) {
              bcrypt.hash(validPassword, 10)
                .then( hash => {
                  var newMerchant = new Merchant({
                    _id: new mongoose.Types.ObjectId,
                    name: validName,
                    email: validEmail,
                    password: hash,
                    image: "uploads/Default.png",
                    isActive: true,
                    lastLoginAt: null,
                    createdAt: new Date,
                    updatedAt: new Date
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
                      throwErr(res, err);
                    });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else if (!merchant.isActive) {
              merchant.update({ $set: { isActive: true } })
                .exec()
                .then( result => {
                  console.log('Merchant created!');
                  return res.status(201).json({
                    message: "Merchant created!"
                  });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else {
              console.log('Merchant exists!');
              return res.status(409).json({
                message: "Merchant exists!"
              });
            }
        })
      } else {
        Merchant.findOne({ $or:[{ name: validName }, { email: validEmail } ]} )
          .exec()
          .then( merchant => {
            if (!merchant) {
              bcrypt.hash(validPassword, 10)
                .then( hash => {
                  var newMerchant = new Merchant({
                    _id: new mongoose.Types.ObjectId,
                    name: validName,
                    email: validEmail,
                    password: hash,
                    image: "uploads/Default.png",
                    isActive: true,
                    lastLoginAt: null,
                    createdAt: new Date,
                    updatedAt: new Date
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
                      throwErr(res, err);
                    });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else if (!merchant.isActive) {
              merchant.update({ $set: { isActive: true } })
                .exec()
                .then( result => {
                  console.log('Merchant created!');
                  return res.status(201).json({
                    message: "Merchant created!"
                  });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else {
              console.log('Merchant exists!');
              return res.status(409).json({
                message: "Merchant exists!"
              });
            }
        })
      }
    })
};

//Log in
//POST api.pointup.io/merchants/login
function logIn(req, res, next) {
  if (!validator.email(req.body.email)) {
    console.log('Invalid email!');
    return res.status(422).json({
      message: "Invalid email!"
    });
  } else if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const validEmail = req.body.email;
  const validPassword = req.body.password;
  Merchant.findOne({ email: validEmail, isActive: true })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Auth failed');
        return res.status(401).json({
          message: 'Auth failed'
        });
      } else {
        bcrypt.compare(validPassword, merchant.password)
          .then( result => {
            merchant.update({ $set: { lastLoginAt: new Date } })
              .exec()
              .then( result => {
                const token = jwt.sign(
                  {
                    name: merchant.name,
                    email: merchant.email,
                    image: merchant.image,
                    lastLoginAt: merchant.lastLoginAt,
                    createdAt: merchant.createdAt,
                    merchantId: merchant._id
                  },
                  process.env.JWT_KEY,
                  {
                      expiresIn: "1y"
                  }
                );
                console.log('Auth successful');
                return res.status(201).json({
                  message: "Auth successful",
                  token: token
                });
              })
              .catch( err => {
                console.log('Auth failed');
                return res.status(401).json({
                  message: "Auth failed"
                });
              });
          })
          .catch( err => {
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

//Update name
//PUT api.pointup.io/merchants/name
function updateName(req, res, next) {
  if (!validator.string(req.body.name)) {
    console.log('Invalid name!');
    return res.status(422).json({
      message: "Invalid name!"
    });
  }
  const validName = req.body.name;
  const validMerchantId = req.merchantData.merchantId;
  Merchant.findOne({ name: validName })
    .exec()
    .then ( merchant => {
      if (!merchant || !merchant.isActive) {
        console.log('Name already taken!');
        return res.status(409).json({
          message: "Name already taken!"
        });
      } else {
        Merchant.findOneAndUpdate({ _id: validMerchantId, isActive: true }, { $set:{ name: validName, updatedAt: new Date } })
          .exec()
          .then( result => {
            console.log('Name changed!');
            return res.status(201).json({
              message: "Name changed!"
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

//Update image
//PUT api.pointup.io/merchants/image
function updateImage(req, res, next) {
  if (!req.file) {
    console.log('Image invalid!');
    return res.status(422).json({
      message: "Image invalid!"
    });
  }
  const validFile = req.file;
  const validMerchantId = req.merchantData.merchantId;
  Merchant.findOne({ _id: validMerchantId, isActive: true })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Merchant doesn\'t exist!');
        return res.status(409).json({
          message: "Merchant doesn't exist!"
        });
      } else {
        fs.stat(merchant.image, (err, stat) => {
          if (!err && merchant.image != 'uploads/Default.png') {
              fs.unlink(merchant.image, (err) => {
                if (err) {
                  throwErr(res, err);
                }
              });
          }
        });
        merchant.update({ $set:{ image: validFile.path, updatedAt: new Date } })
          .exec()
          .then( result => {
            console.log('Image changed!');
            return res.status(201).json({
            message: "Image changed!"
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

//Update
//PUT api.pointup.io/merchants/password
function updatePassword(req, res, next) {
  if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const validPassword = req.body.password;
  const validMerchantId = req.merchantData.merchantId;
  bcrypt.hash(validPassword, 10)
    .then( hash => {
      Merchant.findOneAndUpdate({ _id: validMerchantId, isActive: true }, { $set:{ password: hash, updatedAt: new Date } })
        .exec()
        .then( merchant => {
          console.log('Password changed!');
          return res.status(201).json({
            message: "Password changed!"
          });
        })
        .catch( err => {
          throwErr(res, err);
        });
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Delete Merchant
//DELETE api.pointup.io/merchants/
function deleteMerchant(req, res, next) {
  const validMerchantId = req.merchantData.merchantId;
  Merchant.findOne({ _id: validMerchantId, isActive: true })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Merchant doesn\'t exist!');
        return res.status(409).json({
          message: "Merchant doesn't exist!"
        });
      } else {
        fs.stat(merchant.image, (err, stat) => {
          if (!err && merchant.image != 'uploads/Default.png') {
              fs.unlink(merchant.image, (err) => {
                if (err) {
                  throwErr(res, err);
                }
              });
          }
        });
        merchant.update({ $set:{ isActive: false, updatedAt: new Date } })
          .exec()
          .then( result => {
            console.log('Merchant deleted!');
            res.message1 = "Merchant deleted!";
            next();
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

exports.getMerchant = getMerchant;
exports.verify = verify;
exports.signUp = signUp;
exports.logIn = logIn;
exports.updateName = updateName;
exports.updateImage = updateImage;
exports.updatePassword = updatePassword;
exports.deleteMerchant = deleteMerchant;
