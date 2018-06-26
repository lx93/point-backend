const Merchant = require('../models/merchants');
const Balance = require('../models/balances');
const Verification = require('../models/verifications');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const aws = require('aws-sdk');
const multer = require('multer');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');
const RNG = require('../utils/RNG');
const emailer = require('../utils/emailer');


//Get Merchant info
//GET api.pointup.io/merchants/
/* Retrieve information about your Merchant Point account. */
async function getMerchant(req, res, next) {
  try {
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find a real and active Merchant
    let merchant = await Merchant.findOne({ _id: validMerchantId, isActive: true }).exec();

    //If no Merchant exists
    if (!merchant) {
      console.log('Merchant doesn\'t exist!');
      return res.status(409).json({
        message: "Merchant doesn't exist!"
      });
    //Else
    } else {
      console.log('\n'+merchant+'\n');
      return res.status(200).json({
        merchantId: merchant._id,
        name: merchant.name,
        image: merchant.image,
        email: merchant.email,
        lastLoginAt: merchant.lastLoginAt,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//Verify
//POST api.pointup.io/merchants/verify
/* Verify a Merchant Point account. A verification code will be sent to the listed email. */
async function verify(req, res, next) {
  try {
    if (!validator.email(req.body.email)) {
      console.log('Invalid email!');
      return res.status(422).json({
        message: "Invalid email!"
      });
    }
    const validEmail = req.body.email;      //Email of the Merchant
    const now = new Date;     //Log time
    var x = RNG();    //Randomly generated code
    //Create verification
    var newVerification = new Verification({
      _id: new mongoose.Types.ObjectId,
      email: validEmail,
      code: x,
      createdAt: now
    });
    //Save verification
    await newVerification.save();
    emailer.sendEmail(validEmail, "Pointup Verification code: " + x);

    console.log('Code sent!');
    return res.status(201).json({
      message: "Code sent!"
    });
  } catch (err) {
    throwErr(res, err);
  }
};

//Sign up
//POST api.pointup.io/merchants/signup
/* Sign up and create a Merchant Point account. */
async function signUp(req, res, next) {
  try {
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
    const validName = req.body.name;      //Name of the Merchant
    const validEmail = req.body.email;      //Email of the Merchant
    const validPassword = req.body.password;    //Password of the Merchant
    const validCode = req.body.code;    //Verification code
    //Find a real verification with this Merchant
    let verification = await Verification.findOne({ email: validEmail, code: validCode }).exec();

    //If no verification exists
    if (!verification && (process.env.MODE === 'production' || validCode)) {
      console.log('Auth failed');
      return res.status(401).json({
        message: 'Auth failed'
      });
    //Else
    } else {
      //Find a Merchant with matching name or email
      let merchant = await Merchant.findOne({ $or:[{ name: validName }, { email: validEmail } ]} ).exec();

      //If no merchant exists
      if (!merchant) {
        //Hash password
        let hash = await bcrypt.hash(validPassword, 10);

        const now = new Date;   //Log time
        //Create Merchant
        var newMerchant = new Merchant({
          _id: new mongoose.Types.ObjectId,
          name: validName,
          email: validEmail,
          password: hash,
          image: "DefaultMerchant.png",
          isActive: true,
          lastLoginAt: null,
          createdAt: now,
          updatedAt: now
        });
        //Save Merchant
        await newMerchant.save();

        console.log('Merchant created!');
        return res.status(201).json({
          message: "Merchant created!"
        });
      //If Merchant exists but is not active
      } else if (!merchant.isActive) {
        const now = new Date;     //Log time
        //Set Merchant to active
        await merchant.update({ $set: { isActive: true, updatedAt: now } });
        res.merchantId = merchant._id;
        console.log('Merchant created!');
        res.message1 = "Merchant created!";
        next();
      //Else
      } else {
        console.log('Merchant exists!');
        return res.status(409).json({
          message: "Merchant exists!"
        });
      }
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//Log in
//POST api.pointup.io/merchants/login
/* Log into your Merchant Point account. A token will be sent back in the response, enabling the Merchant to store it for authorization. */
async function logIn(req, res, next) {
  try {
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
    const validEmail = req.body.email;      //Email of the Merchant
    const validPassword = req.body.password;      //Password of the Merchant
    //Find a real and active Merchant with this email
    let merchant = await Merchant.findOne({ email: validEmail, isActive: true }).exec();

    //If no Merchant exists
    if (!merchant) {
      console.log('Auth failed');
      return res.status(401).json({
        message: 'Auth failed'
      });
    //Else
    } else {
      //Check hashed password
      let result = await bcrypt.compare(validPassword, merchant.password);
      if (result) {
        const now = new Date;     //Log time
        //Log in Merchant
        await merchant.update({ $set: { lastLoginAt: now } }).exec();
        //Create JWT Token
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

        //Pass JWT Token
        console.log('Auth successful');
        return res.status(201).json({
          message: "Auth successful",
          token: token
        });
      } else {
        console.log('Auth failed');
        return res.status(401).json({
          message: "Auth failed"
        });
      }
    }
  } catch (err) {
    console.log('Auth failed');
    return res.status(401).json({
      message: "Auth failed"
    });
  }
};

//Update name
//PUT api.pointup.io/merchants/name
/* Change the name to your Merchant Point account. */
async function updateName(req, res, next) {
  try {
    if (!validator.string(req.body.name)) {
      console.log('Invalid name!');
      return res.status(422).json({
        message: "Invalid name!"
      });
    }
    const validName = req.body.name;      //New name of the Merchant
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find a Merchant with that name
    let merchant = await Merchant.findOne({ name: validName }).exec();

    //If no merchant exists or is inactive
    if (!merchant || !merchant.isActive) {
      console.log('Name already taken!');
      return res.status(409).json({
        message: "Name already taken!"
      });
    //Else
    } else {
      const now = new Date;     //Log time
      //Find and update Merchant name
      await Merchant.findOneAndUpdate({ _id: validMerchantId, isActive: true }, { $set:{ name: validName, updatedAt: now } }).exec();

      console.log('Name changed!');
      return res.status(201).json({
        message: "Name changed!"
      });
    }
  } catch (err) {
    throwErr(res, err);
  }
};

//Update image
//PUT api.pointup.io/merchants/image
/* Change the image to your Merchant Point account. */
async function updateImage(req, res, next) {
  try {
    if (!req.file) {
      console.log('Image invalid!');
      return res.status(422).json({
        message: "Image invalid!"
      });
    }
    const validFile = req.file;     //Valid file
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find a real and active Merchant
    let merchant = await Merchant.findOne({ _id: validMerchantId, isActive: true }).exec();

    //If no Merchant exists
    if (!merchant) {
      console.log('Merchant doesn\'t exist!');
      return res.status(409).json({
        message: "Merchant doesn't exist!"
      });
    //Else
    } else {
      //If Merchant does not have the default image
      if (merchant.image != 'DefaultMerchant.png') {
        //Find the Merchant's current image
        const s3 = new aws.S3();
        var params = {
          Bucket: 'point-server',
          Key: merchant.image
        }
        s3.headObject(params, function(err, data) {
          if (!err) {
            var params = {
              Bucket: 'point-server',
              Delete: {
                Objects: [{ "Key": merchant.image }]
              }
            }
            //Delete old image
            s3.deleteObjects(params, function(err, data) {
              if (err) throwErr(res, err);
            });
          }
        });
      }
      const now = new Date;     //Log time
      //Update Merchant image
      await merchant.update({ $set:{ image: validFile.key, updatedAt: now } }).exec();

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
//PUT api.pointup.io/merchants/password
/* Change the password to your Merchant Point account. */
async function updatePassword(req, res, next) {
  try {
    if (!validator.string(req.body.password)) {
      console.log('Invalid password!');
      return res.status(422).json({
        message: "Invalid password!"
      });
    }
    const validPassword = req.body.password;      //New password of the Merchant
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    const now = new Date;     //Log time
    //Hash password
    let hash = await bcrypt.hash(validPassword, 10);

    //Find and update Merchant password
    await Merchant.findOneAndUpdate({ _id: validMerchantId, isActive: true }, { $set:{ password: hash, updatedAt: now } }).exec();

    console.log('Password changed!');
    return res.status(201).json({
      message: "Password changed!"
    });
  } catch (err) {
    throwErr(res, err);
  }
};

//Delete Merchant
//DELETE api.pointup.io/merchants/
/* Completely delete the Merchant from the Point database. */
async function deleteMerchant(req, res, next) {
  try {
    const validMerchantId = req.merchantData.merchantId;      //MerchantId of the Merchant
    //Find a real and active Merchant
    let merchant = await Merchant.findOne({ _id: validMerchantId, isActive: true }).exec();

    //If no Merchant exists
    if (!merchant) {
      console.log('Merchant doesn\'t exist!');
      return res.status(409).json({
        message: "Merchant doesn't exist!"
      });
    //Else
    } else {
      const now = new Date;     //Log time
      //Deactivate Merchant
      await merchant.update({ $set:{ isActive: false, updatedAt: now } }).exec();

      console.log('Merchant deleted!');
      res.message1 = "Merchant deleted!";
      //Continue
      next();
    }
  } catch (err) {
    throwErr(res, err);
  }
};


//Get All Merchants
//GET api.pointup.io/users/merchants
/* Retrieve a list of all Merchants */
async function getMerchantAll(req, res, next) {
  //Find all Merchants
  let merchant = await Merchant.find({ isActive: true }).sort({ name: 1 }).exec();

  //If no Merchant exists
  if (!merchant.length) {
    console.log('There are no Merchants!');
    return res.status(409).json({
      message: "There are no Merchants!"
    });
  //Else
  } else {
    var merchants = [];
    for (var i = 0; i < merchant.length; i++) {
      merchants[i] = {
        merchantId: merchant[i]._id,
        name: merchant[i].name,
        image: merchant[i].image
      }
    }
    console.log('\n'+JSON.stringify(merchants, ",", " ")+'\n');
    return res.status(200).json({
      merchants
    });
  }
};

//Get Specific Merchant
//GET api.pointup.io/users/merchants/:merchantId
/* Retreive information about a specific Merchant */
async function getMerchantOne(req, res, next) {
  const validMerchantId = req.params.merchantId;
  let merchant = await Merchant.findOne({ _id: validMerchantId, isActive: true }).exec();

  if (!merchant) {
    console.log('Merchant doesn\'t exist!');
    return res.status(409).json({
      message: "Merchant doesn't exist!"
    });
  } else {
    console.log(merchant);
    return res.status(200).json({
      merchantId: merchant._id,
      name: merchant.name,
      image: merchant.image,
      createdAt: merchant.createdAt
    });
  }
};


exports.getMerchant = getMerchant;
exports.verify = verify;
exports.signUp = signUp;
exports.logIn = logIn;
exports.updateName = updateName;
exports.updateImage = updateImage;
exports.updatePassword = updatePassword;
exports.deleteMerchant = deleteMerchant;
exports.getMerchantOne = getMerchantOne;
exports.getMerchantAll = getMerchantAll;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
