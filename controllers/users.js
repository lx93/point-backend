const User = require('../models/users');
const Balance = require('../models/balances');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//Get User info
//GET localhost:3000/users/
function getUser(req, res, next) {
  const id = req.userData.userId;
  User.findOne({ _id: id })
    .exec()
    .then( user => {
      console.log('\n'+user+'\n');
      return res.status(200).json({
        phone: user.phone,
        userId: user._id
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
//POST localhost:3000/users/signup
function signUp(req, res, next) {
  User.findOne({ phone: req.body.phone })
    .exec()
    .then( user => {
      if (!user) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: err
            });
          }
          var newUser = new User({
            _id: new mongoose.Types.ObjectId,
            phone: req.body.phone,
            password: hash
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
              console.log(err);
              return res.status(500).json({
                error: err
              });
            });
        });
      } else {
        console.log('User exists!');
        return res.status(409).json({
          message: "User exists!"
        });
      }
    })
    .catch( err => {
      console.log('Invalid input!');
      return res.status(422).json({
        message: "Invalid input!"
      });
    });
};

//Log in
//POST localhost:3000/users/login
function logIn(req, res, next) {
  User.findOne({ phone: req.body.phone })
    .exec()
    .then( user => {
      if (!user) {
        console.log('Auth failed');
        return res.status(401).json({
          message: 'Auth failed'
        })
      } else {
        bcrypt.compare(req.body.password, user.password, (err, result) => {
          if (err) {
            console.log('Auth failed');
            return res.status(401).json({
              message: "Auth failed"
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                phone: user.phone,
                userId: user._id
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
//PUT localhost:3000/users/password
function updatePassword(req, res, next) {
  const id = req.userData.userId;
  User.findOne({ _id: id })
    .exec()
    .then( user => {
      if (req.body.password) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: err
            });
          }
          User.update({ password: hash })
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

//Delete User
//DELETE localhost:3000/users/
function deleteUser(req, res, next) {
  const id = req.userData.userId;
  User.findOne({ _id: id })
    .exec()
    .then( user => {
      if (!user) {
        console.log('User does\'t exist!');
        return res.status(409).json({
          message: "User doesn't exist!"
        });
      } else {
        User.remove({ _id: id })
          .exec()
          .then(result => {
            console.log('User deleted!');
            Balance.find({ phone: req.userData.phone })
              .exec()
              .then( balance => {
                if (!balance.length) {
                  return res.status(201).json({
                    message: "User deleted!"
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
    });
};

exports.getUser = getUser;
exports.signUp = signUp;
exports.logIn = logIn;
exports.updatePassword = updatePassword;
exports.deleteUser = deleteUser;
