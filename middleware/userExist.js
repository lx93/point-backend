const User = require('../models/users');
const mongoose = require('mongoose');

function userExist(req, res, next) {
  const validUserId = req.userData.userId;
  User.findOne({ _id: validUserId, isActive: true })
    .exec()
    .then( user => {
      if (!user) {
        console.log('Auth failed');
        return res.status(401).json({
          message: "Auth failed"
        });
      } else {
        next();
      }
    })
    .catch( err => {
      console.log('Auth failed');
      return res.status(401).json({
        message: "Auth failed"
      });
    });
};

module.exports = userExist;
