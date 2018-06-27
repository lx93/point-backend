const User = require('../models/users');
const Balance = require('../models/balances');
const Verification = require('../models/verifications');
const FBUser = require('../models/fbUsers');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('request-promise');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');
const RNG = require('../utils/RNG');
const messenger = require('../utils/messenger');
const sendToken = require('../utils/sendToken');


//Get User info
//GET api.pointup.io/users/
/* Retrieve information about your User Point account. */
async function getUser(req, res, next) {
  try {
    const user = req.user;      //User

    console.log('\n'+user+'\n');
    return res.status(200).json({
      name: user.name,
      dob: user.dob,
      phone: user.phone,
      image: user.image,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      userId: user._id
    });
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
    const now = new Date;     //Log time
    var x = RNG();      //Randomly generated code
    //Create verification
    var newVerification = new Verification({
      _id: new mongoose.Types.ObjectId,
      phone: validPhone,
      code: x,
      createdAt: now
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
    var validDOB;
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
    } else if (!validator.string(req.body.name)) {
      console.log('Invalid name!');
      return res.status(422).json({
        message: "Invalid name!"
      });
    }
    if (req.body.dob) {
      validDOB = dob[2]+"-"+dob[0]+"-"+dob[1];      //Date Of Birth of Facebook User
      if (!validator.dob(validDOB)) {
        console.log('Invalid date!');
        return res.status(422).json({
          message: "Invalid date!"
        });
      }
      validDOB = new Date(validDOB);      //Date Of Birth of the User
    }
    const validPassword = req.body.password;      //Password of the User
    const validCode = req.body.code;      //Verification code
    const validName = req.body.name;      //Name of the User
    //Find a real verification with this User
    let verification = await Verification.findOne({ phone: validPhone, code: validCode }).exec();

    //If no verification exists
    if (!verification && (process.env.MODE === 'production' || validCode)) {
      console.log('Auth failed');
      return res.status(401).json({
        message: 'Auth failed'
      });
    //Else
    } else {
      //Find a real User
      let user = await User.findOne({ phone: validPhone }).exec();

      //If no User exists
      if (!user) {
        //Hash password
        let hash = await bcrypt.hash(validPassword, 10);

        const now = new Date;     //Log time
        //Create User
        var newUser = new User({
          _id: new mongoose.Types.ObjectId,
          phone: validPhone,
          password: hash,
          name: validName,
          dob: validDOB,
          image: 'DefaultUser.png',
          isActive: true,
          lastLoginAt: null,
          createdAt: now,
          updatedAt: now
        });
        //Save User
        await newUser.save();

        console.log('User created!');
        return res.status(201).json({
          message: "User created!"
        });
      //If the User exists but is inactive
      } else if (!user.isActive) {
        const now = new Date;     //Log time
        //Reactivate the User
        await user.update({ $set: { isActive: true, updatedAt: now } }).exec();

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
    }
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
      if (!user.password) {
        //Hash password
        let hash = await bcrypt.hash(validPassword, 10);

        const now = new Date;     //Log time
        //Log in User
        await user.update({ $set: { password: hash, lastLoginAt: now } }).exec();

        //Save User information
        req.userData = user;
        sendToken(req, res);
      } else {
        //Check hashed password
        let result = await bcrypt.compare(validPassword, user.password);
        if (result) {
          const now = new Date;     //Log time
          //Log in User
          await user.update({ $set: { lastLoginAt: now } }).exec();

          //Save User information
          req.userData = user;
          sendToken(req, res);
        } else {
          console.log('Auth failed');
          return res.status(401).json({
            message: "Auth failed"
          });
        }
      }
    }
  } catch (err) {
    console.log('Auth failed');
    return res.status(401).json({
      message: "Auth failed"
    });
  }
};

//Facebook authentication
//POST api.pointup.io/users/fbAuth
/* Log into your User Point account via Facebook. A token will be sent back in the response, enabling the User to store it for authorization. */
async function fbAuth(req, res, next) {
  try {
    if (!req.body.accessToken) {
      console.log('Invalid access token!');
      return res.status(422).json({
        message: "Invalid access token!"
      });
    }
    const userFieldSet = 'id, name, birthday';      //Fields to retrieve
    const options = {
      method: 'GET',
      uri: 'https://graph.facebook.com/v2.8/me',
      qs: {
        access_token: req.body.accessToken,
        fields: userFieldSet
      }
    };
    var response;
    //Authenticate Facebook user
    try {
      response = await request(options);
    } catch (err) {
      console.log('Invalid access token!');
      return res.status(422).json({
        message: "Invalid access token!"
      });
    }
    const fbRes = JSON.parse(response);

    const validFBId = fbRes.id;     //Facebook User Id
    const validName = fbRes.name;     //Name of the Facebook User
    var validDOB;
    if (fbRes.birthday) {
      const dob = fbRes.birthday.split("/");
      validDOB = new Date(dob[2]+"-"+dob[0]+"-"+dob[1]);      //Date Of Birth of Facebook User
    }
    //Find a real Facebook User ID
    let fbUser = await FBUser.findOne({ fbId: validFBId }).exec();

    //If no Facebook User Id exists
    if (!fbUser) {
      //If no phone is in the body
      if (!req.body.phone) {
        console.log('FBId doesn\'t exist!');
        return res.status(202).json({
          message: "FBId doesn't exist!"
        });
      //Else
      } else {
        const validPhone = String(req.body.phone).replace(/[^0-9]/g, "");     //Phone number of the User
        if (!validator.phone(validPhone)) {
          console.log('Invalid phone!');
          return res.status(422).json({
            message: "Invalid phone!"
          });
        }
        const validCode = req.body.code;      //Verification code
        //Find a real verification with this User
        let verification = await Verification.findOne({ phone: validPhone, code: validCode }).exec();

        //If no verification exists
        if (!verification && (process.env.MODE === 'production' || validCode)) {
          console.log('Auth failed');
          return res.status(401).json({
            message: 'Auth failed'
          });
        //Else
        } else {
          //Find a real User
          let user = await User.findOne({ phone: validPhone }).exec();

          //If no User exists
          if (!user) {
            const now = new Date;     //Log time
            //Create User
            var newUser = new User({
              _id: new mongoose.Types.ObjectId,
              phone: validPhone,
              name: validName,
              dob: validDOB,
              image: 'DefaultUser.png',
              isActive: true,
              lastLoginAt: now,
              createdAt: now,
              updatedAt: now
            });
            //Save User
            await newUser.save();

            //Create fbUser
            var newFBUser = new FBUser({
              _id: new mongoose.Types.ObjectId,
              phone: validPhone,
              fbId: validFBId,
              name: validName,
              dob: validDOB
            });
            //Save fbUser
            await newFBUser.save();

            //Save User information
            req.userData = newUser;
            sendToken(req, res);
          //If the User exists but is inactive
          } else if (!user.isActive) {
            const now = new Date;     //Log time
            //Reactivate the User
            await user.update({ $set: { isActive: true, updatedAt: now, lastLoginAt: now } }).exec();

            //Create fbUser
            var newFBUser = new FBUser({
              _id: new mongoose.Types.ObjectId,
              phone: user.phone,
              fbId: validFBId,
              name: validName,
              dob: validDOB
            });
            //Save fbUser
            await newFBUser.save();

            //Save User information
            req.userData = user;
            sendToken(req, res);
          //Else
          } else {
            const now = new Date;     //Log time
            //Log in the User
            await user.update({ $set: { lastLoginAt: now } }).exec();

            //Create fbUser
            var newFBUser = new FBUser({
              _id: new mongoose.Types.ObjectId,
              phone: user.phone,
              fbId: validFBId,
              name: validName,
              dob: validDOB
            });
            //Save fbUser
            await newFBUser.save();

            //Save User information
            req.userData = user;
            sendToken(req, res);
          }
        }
      }
    //Else
    } else {
      //Find a real User
      let user = await User.findOne({ phone: fbUser.phone }).exec();

      if (!user) {
        //This should never happen. This will only occur if the Users table was deleted while the fbusers was not.
        await FBUser.deleteOne({ fbId: validFBId }).exec();
        console.log('FBId doesn\'t exist!');
        return res.status(202).json({
          message: "FBId doesn't exist!"
        });
      } else if (!user.isActive) {
        const now = new Date;     //Log time
        //Update FB information
        await fbUser.update({ $set: { name: validName, dob: validDOB }}).exec();
        //Log in the User
        await user.update({ $set: { isActive: true, updatedAt: now, lastLoginAt: now } }).exec();

        //Save User information
        req.userData = user;
        sendToken(req, res);
      } else {
        const now = new Date;     //Log time
        //Update FB information
        await fbUser.update({ $set: { name: validName, dob: validDOB }}).exec();
        //Log in the User
        await user.update({ $set: { lastLoginAt: now } }).exec();

        //Save User information
        req.userData = user;
        sendToken(req, res);
      }
    }
  } catch (err) {
    throwErr(res, err);
  }
}

//Update name
//PUT api.pointup.io/users/name
/* Change the name to your User Point account. */
async function updateName(req, res, next) {
  try {
    if (!validator.string(req.body.name)) {
      console.log('Invalid name!');
      return res.status(422).json({
        message: "Invalid name!"
      });
    }
    const validName = req.body.name;      //New name of the User
    const user = req.user;      //User
    const now = new Date;     //Log time
    //Update User name
    await user.update({ $set:{ name: validName, updatedAt: now } }).exec();

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
    const user = req.user;      //User
    const now = new Date;     //Log time

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
    await user.update({ $set:{ image: validFile.key, updatedAt: now } }).exec();

    console.log('Image changed!');
    return res.status(201).json({
      message: "Image changed!"
    });
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
    const user = req.user      //User
    const now = new Date;     //Log time
    //Hash password
    let hashPassword = await bcrypt.hash(validPassword, 10);

    //Update User password
    await user.update({ $set: { password: hashPassword, updatedAt: now } }).exec();

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
    const user = req.user;      //User
    const now = new Date;     //Log time
    //Find and deactive a real and active User
    await user.update({ $set: { isActive: false, updatedAt: now } }).exec();

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
exports.fbAuth = fbAuth;
exports.updateName = updateName;
exports.updateImage = updateImage;
exports.updatePassword = updatePassword;
exports.deleteUser = deleteUser;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
