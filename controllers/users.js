const User = require('../models/users');
const Balance = require('../models/balances');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');


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
      throwErr(res, err);
    });
};

//Sign up
//POST localhost:3000/users/signup
function signUp(req, res, next) {
  const phone = String(req.body.phone).replace(/[^0-9]/g, "");
  if (!validator.phone(phone)) {
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
  User.findOne({ phone: phone })
    .exec()
    .then( user => {
      if (!user) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            throwErr(res, err);
          }
          var newUser = new User({
            _id: new mongoose.Types.ObjectId,
            phone: phone,
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
              throwErr(res, err);
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
      throwErr(res, err);
    });
};

//Log in
//POST localhost:3000/users/login
function logIn(req, res, next) {
  const phone = String(req.body.phone).replace(/[^0-9]/g, "");
  if (!validator.phone(phone)) {
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
  User.findOne({ phone: phone })
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
            throwErr(res, err);
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
              message: "Auth successful",
              token: token
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
      throwErr(res, err);
    });
};

//Recommend
//POST localhost:3000/users/recommend
function recommend(req, res, next) {
  const phone = String(req.body.phone).replace(/[^0-9]/g, "");
  if (!validator.phone(phone)) {
    console.log('Invalid phone!');
    return res.status(422).json({
      message: "Invalid phone!"
    });
  }
  User.findOne({ phone: phone })
    .exec()
    .then( user => {
      if (!user) {
        Console.log("Recommendation sent!");
        return res.status(422).json({
          message: "Recommendation sent!"
        });
      } else {
        console.log('Phone number already registered!');
        return res.status(422).json({
          message: "Phone number already registered!"
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
}

//Update
//PUT localhost:3000/users/password
function updatePassword(req, res, next) {
  if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const id = req.userData.userId;
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      throwErr(res, err);
    }
    User.findOneAndUpdate({ _id: id }, { $set: { password: hash } })
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
        console.log('User doesn\'t exist!');
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
                throwErr(res, err);
              });
          })
          .catch(err => {
            throwErr(res, err);
          });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

exports.getUser = getUser;
exports.signUp = signUp;
exports.logIn = logIn;
exports.recommend = recommend
exports.updatePassword = updatePassword;
exports.deleteUser = deleteUser;
