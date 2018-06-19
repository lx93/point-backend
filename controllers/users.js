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
/* Retrieve information about your User Point account. */
async function getUser(req, res, next) {
  try {
    const validUserId = req.userData.userId;      //UserId of the User
    //Find a real and active User
    let user = await User.findOne({ _id: validUserId, isActive: true }).exec();

    //If no User exists or is inactive
    if (!user || !user.isActive) {
      console.log('User doesn\'t exist!');
      return res.status(409).json({
        message: "User doesn't exist!"
      });
    //Else
    } else {
      console.log('\n'+user+'\n');
      return res.status(200).json({
        phone: user.phone,
        userId: user._id,
        lastLoginAt: user.lastLoginAt
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//Verify
//POST api.pointup.io/users/verify
/* Verify a User Point account. A verification code will be sent to the listed phone number. */
async function verify(req, res, next) {
  try {
    const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");     //Phone number of the User
    if (!validator.phone(validPhone)) {
      console.log('Invalid phone!');
      return res.status(422).json({
        message: "Invalid phone!"
      });
    }
    var x = RNG();      //Randomly generated code
    //Create verification
    var newVerification = new Verification({
      _id: new mongoose.Types.ObjectId,
      phone: validPhone,
      code: x,
      createdAt: new Date
    });
    //Save verification
    await newVerification.save();
    messenger.sendText(validPhone, "Pointup Verification code: " + x);

    console.log('Code sent!');
    return res.status(201).json({
      message: "Code sent!"
    });
  } catch (err) {
    throwErr(res, err);
  }
};

//Sign up
//POST api.pointup.io/users/signup
/* Sign up and create a User Point account. */
async function signUp(req, res, next) {
  try {
    const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");     //Phone number of the User
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
    } else if (req.body.firstName) {
      if (!validator.string(req.body.firstName)) {
        console.log('Invalid first name!');
        return res.status(422).json({
          message: "Invalid first name!"
        });
      }
    } else if (req.body.lastName) {
      if (!validator.string(req.body.lastName)) {
        console.log('Invalid last name!');
        return res.status(422).json({
          message: "Invalid last name!"
        });
      }
    } else if (!validator.dob(req.body.dob)) {
      console.log('Invalid date!');
      return res.status(422).json({
        message: "Invalid date!"
      });
    }
    const validPassword = req.body.password;      //Password of the User
    const validCode = req.body.code;      //Verification code
    const validFName = req.body.firstName;      //First name of the User
    const validLName = req.body.lastName;      //Last name of the User
    const validDOB = new Date(req.body.dob);      //Date Of Birth of the User
    //Find a real verification with this User
    let verification = await Verification.findOne({ phone: validPhone, code: validCode }).exec();

    /* //<-- Delete "/*" for production
    //If no verification exists
    if (!verification) {
      console.log('Auth failed');
      return res.status(401).json({
        message: 'Auth failed'
      });
    //Else
    } else {    //Delete that ---> */
      //Find a real User
      let user = await User.findOne({ phone: validPhone }).exec();

      //If no User exists
      if (!user) {
        //Hash password
        let hash = await bcrypt.hash(validPassword, 10);

        //Create User
        var newUser = new User({
          _id: new mongoose.Types.ObjectId,
          phone: validPhone,
          password: hash,
          firstName: validFName,
          lastName: validLName,
          dob: validDOB,
          image: 'DefaultUser.png',
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date,
          updatedAt: new Date
        });
        //Save User
        await newUser.save();

        console.log('User created!');
        return res.status(201).json({
          message: "User created!"
        });
      //If the User exists but is inactive
      } else if (!user.isActive) {
        //Reactivate the User
        await user.update({ $set: { isActive: true } }).exec();

        console.log('User created!');
        return res.status(201).json({
          message: "User created!"
        });
      //Else
      } else {
        console.log('User exists!');
        return res.status(409).json({
          message: "User exists!"
        });
      }
    // } //Delete starting "// for production
  } catch (err) {
    throwErr(res, err);
  }
};

//Log in
//POST api.pointup.io/users/login
/* Log into your User Point account. A token will be sent back in the response, enabling the User to store it for authorization. */
async function logIn(req, res, next) {
  try {
    const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");     //Phone number of the User
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
    const validPassword = req.body.password;    //Password of the User
    //Find a real User with that phone
    let user = await User.findOne({ phone: validPhone }).exec();

    //If no User exists or is inactive
    if (!user || !user.isActive) {
      console.log('Auth failed');
      return res.status(401).json({
        message: 'Auth failed'
      });
    //Else
    } else {
      //Check hashed password
      await bcrypt.compare(validPassword, user.password);
      //Log in User
      await user.update({ $set: { lastLoginAt: new Date } }).exec();
      //Create JWT Token
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

      //Pass JWT Token
      console.log('Auth successful');
      return res.status(201).json({
        message: "Auth successful",
        token: token
      });
    }
  } catch (err) {
    console.log('Auth failed');
    return res.status(401).json({
      message: "Auth failed"
    });
  }
};

//Update name
//PUT api.pointup.io/users/name
/* Change the name to your User Point account. */
async function updateName(req, res, next) {
  try {
    if (!validator.string(req.body.firstName)) {
      console.log('Invalid first name!');
      return res.status(422).json({
        message: "Invalid first name!"
      });
    } else if (!validator.string(req.body.lastName)) {
      console.log('Invalid last name!');
      return res.status(422).json({
        message: "Invalid last name!"
      });
    }
    const validFName = req.body.firstName;      //New first name of the User
    const validLName = req.body.lastName;     //New last name of the User
    const validUserId = req.userData.userId;      //UserId of the User
    //Find and update User name
    await User.findOneAndUpdate({ _id: validUserId, isActive: true }, { $set:{ firstName: validFName, lastName: validLName, updatedAt: new Date } }).exec();

    console.log('Name changed!');
    return res.status(201).json({
      message: "Name changed!"
    });
  } catch (err) {
    throwErr(res, err);
  }
};

//Update image
//PUT api.pointup.io/users/image
/* Change the image to your User Point account. */
async function updateImage(req, res, next) {
  try {
    if (!req.file) {
      console.log('Image invalid!');
      return res.status(422).json({
        message: "Image invalid!"
      });
    }
    const validFile = req.file;     //Valid file
    const validUserId = req.userData.userId;      //UserId of the User
    //Find a real and active User
    let user = await User.findOne({ _id: validUserId, isActive: true }).exec();
    //If no User exists
    if (!user) {
      console.log('User doesn\'t exist!');
      return res.status(409).json({
        message: "User doesn't exist!"
      });
    //Else
    } else {
      //If User does not have the default image
      if (user.image != 'DefaultUser.png') {
        //Find the User's current image
        const s3 = new aws.S3();
        var params = {
          Bucket: 'point-server',
          Key: user.image
        }
        s3.headObject(params, function(err, data) {
          if (!err) {
            var params = {
              Bucket: 'point-server',
              Delete: {
                Objects: [{ "Key": user.image }]
              }
            }
            //Delete old image
            s3.deleteObjects(params, function(err, data) {
              if (err) throwErr(res, err);
            });
          }
        });
      }
      //Update User image
      await user.update({ $set:{ image: validFile.key, updatedAt: new Date } }).exec();

      console.log('Image changed!');
      return res.status(201).json({
        message: "Image changed!"
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//Update password
//PUT api.pointup.io/users/password
/* Change the password to your User Point account. */
async function updatePassword(req, res, next) {
  try {
    if (!validator.string(req.body.password)) {
      console.log('Invalid password!');
      return res.status(422).json({
        message: "Invalid password!"
      });
    }
    const validPassword = req.body.password;      //New password of the User
    const validUserId = req.userData.userId;      //UserId of the User
    //Hash password
    let hash = await bcrypt.hash(validPassword, 10);

    //Find and update User password
    let user = await User.findOneAndUpdate({ _id: validUserId }, { $set: { password: hash, updatedAt: new Date } }).exec();

    console.log('Password changed!');
    return res.status(201).json({
      message: "Password changed!"
    });
  } catch (err) {
    throwErr(res, err);
  }
};

//Delete User
//DELETE api.pointup.io/users/
/* Completely delete the User from the Point database. */
async function deleteUser(req, res, next) {
  try {
    const validUserId = req.userData.userId;      //UserId of the User
    //Find and deactive a real and active User
    await User.findOneAndUpdate({ _id: validUserId, isActive: true }, { $set: { isActive: false, updatedAt: new Date } }).exec();

    console.log('User deleted!');
    return res.status(201).json({
      message: "User deleted!"
    });
  } catch (err) {
    throwErr(res, err);
  }
};

exports.getUser = getUser;
exports.verify = verify;
exports.signUp = signUp;
exports.logIn = logIn;
exports.updateName = updateName;
exports.updateImage = updateImage;
exports.updatePassword = updatePassword;
exports.deleteUser = deleteUser;
