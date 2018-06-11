const User = require('../models/users');
const Balance = require('../models/balances');
const Verification = require('../models/verifications');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');
const RNG = require('../utils/RNG');
const messenger = require('../utils/messenger')


//Get User info
//GET api.pointup.io/users/
function getUser(req, res, next) {
  const validUserId = req.userData.userId;
  User.findOne({ _id: validUserId })
    .exec()
    .then( user => {
      if (!user || !user.isActive) {
        console.log('User doesn\'t exist!');
        return res.status(409).json({
          message: "User doesn't exist!"
        });
      } else {
        console.log('\n'+user+'\n');
        return res.status(200).json({
          phone: user.phone,
          userId: user._id,
          lastLoginAt: user.lastLoginAt
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Verify
//POST api.pointup.io/users/verify
function verify(req, res, next) {
  const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");
  if (!validator.phone(validPhone)) {
    console.log('Invalid phone!');
    return res.status(422).json({
      message: "Invalid phone!"
    });
  }
  User.findOne({ phone: validPhone })
    .exec()
    .then( user => {
      var x = RNG();
      var newVerification = new Verification({
        _id: new mongoose.Types.ObjectId,
        phone: validPhone,
        code: x
      });
      newVerification
        .save()
        .then( result => {
          messenger.sendMessage(validPhone, "Pointup Verification code: " + x);
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
//POST api.pointup.io/users/signup
function signUp(req, res, next) {
  const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");
  if (!validator.phone(validPhone)) {
    console.log('Invalid phone!');
    return res.status(422).json({
      message: "Invalid phone!"
    });
  } else if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const validPassword = req.body.password;
  const validCode = req.body.code;
  Verification.findOne({ phone: validPhone, code: validCode })
    .exec()
    .then( verification => {
      if (!verification) {
        /*console.log('Auth failed');
        return res.status(401).json({
          message: 'Auth failed'
        });*/
        User.findOne({ phone: validPhone })
          .exec()
          .then( user => {
            if (!user) {
              bcrypt.hash(validPassword, 10)
                .then( hash => {
                  var newUser = new User({
                    _id: new mongoose.Types.ObjectId,
                    phone: validPhone,
                    password: hash,
                    isActive: true,
                    lastLoginAt: null,
                    createdAt: new Date,
                    updatedAt: new Date
                  });
                  newUser
                    .save()
                    .then( result => {
                      console.log('User created!');
                      return res.status(201).json({
                        message: "User created!"
                      });
                    })
                    .catch( err => {
                      throwErr(res, err);
                    });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else if (!user.isActive) {
              user.update({ $set: { isActive: true } })
                .exec()
                .then( result => {
                  console.log('User created!');
                  return res.status(201).json({
                    message: "User created!"
                  });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else {
              console.log('User exists!');
              return res.status(409).json({
                message: "User exists!"
              });
            }
        })
      } else {
        User.findOne({ phone: validPhone })
          .exec()
          .then( user => {
            if (!user) {
              bcrypt.hash(validPassword, 10)
                .then( hash => {
                  var newUser = new User({
                    _id: new mongoose.Types.ObjectId,
                    phone: validPhone,
                    password: hash,
                    isActive: true,
                    lastLoginAt: null,
                    createdAt: new Date,
                    updatedAt: new Date
                  });
                  newUser
                    .save()
                    .then( result => {
                      console.log('User created!');
                      return res.status(201).json({
                        message: "User created!"
                      });
                    })
                    .catch( err => {
                      throwErr(res, err);
                    });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else if (!user.isActive) {
              user.update({ $set: { isActive: true } })
                .exec()
                .then( result => {
                  console.log('User created!');
                  return res.status(201).json({
                    message: "User created!"
                  });
                })
                .catch( err => {
                  throwErr(res, err);
                });
            } else {
              console.log('User exists!');
              return res.status(409).json({
                message: "User exists!"
              });
            }
        })
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Log in
//POST api.pointup.io/users/login
function logIn(req, res, next) {
  const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");
  if (!validator.phone(validPhone)) {
    console.log('Invalid phone!');
    return res.status(422).json({
      message: "Invalid phone!"
    });
  } else if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const validPassword = req.body.password;
  User.findOne({ phone: validPhone })
    .exec()
    .then( user => {
      if (!user || !user.isActive) {
        console.log('Auth failed');
        return res.status(401).json({
          message: 'Auth failed'
        });
      } else {
        bcrypt.compare(validPassword, user.password)
          .then( result => {
            user.update({ $set: { lastLoginAt: new Date } })
              .exec()
              .then( result => {
                const token = jwt.sign(
                  {
                    phone: user.phone,
                    userId: user._id,
                    lastLoginAt: new Date
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

//Update
//PUT api.pointup.io/users/password
function updatePassword(req, res, next) {
  if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const validPassword = req.body.password;
  const validUserId = req.userData.userId;
  bcrypt.hash(validPassword, 10)
    .then( hash => {
      User.findOneAndUpdate({ _id: validUserId }, { $set: { password: hash, updatedAt: new Date } })
        .exec()
        .then( user => {
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

//Delete User
//DELETE api.pointup.io/users/
function deleteUser(req, res, next) {
  const validUserId = req.userData.userId;
  User.findOneAndUpdate({ _id: validUserId }, { $set: { isActive: false, updatedAt: new Date } })
    .exec()
    .then( user => {
      console.log('User deleted!');
      return res.status(201).json({
        message: "User deleted!"
      });
    })
    .catch( err => {
      throwErr(res, err);
    });
};

exports.getUser = getUser;
exports.signUp = signUp;
exports.logIn = logIn;
exports.verify = verify;
//exports.recommend = recommend
exports.updatePassword = updatePassword;
exports.deleteUser = deleteUser;
