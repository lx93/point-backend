const User = require('../models/users');

const mongoose = require('mongoose');

async function userExist(req, res, next) {
  try {
    const validUserId = req.userData.userId;
    //Find a real and active User
    let user = await User.findOne({ _id: validUserId, isActive: true }).exec();

    //If no User exists
    if (!user) {
      console.log('Auth failed');
      return res.status(401).json({
        message: "Auth failed"
      });
    //Else
    } else {
      //Save the User
      req.user = user;
      //Continue
      next();
    }
  } catch (err) {
    console.log('Auth failed');
    return res.status(401).json({
      message: "Auth failed"
    });
  }
};

module.exports = userExist;
