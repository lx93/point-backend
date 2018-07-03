const express = require('express');
const bController = require('../controllers/balances');
const balanceExist = require('../middleware/balanceExist');
const merchantValid = require('../middleware/merchantValid');
const validator = require('../utils/validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//api.pointup.io/balances
const router = express.Router();

//Balances

//Issue Charge
router.post('/', merchantValid, (req, res, next) => {

  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express

  const charge = stripe.charges.create({
    amount: 999,
    currency: 'usd',
    description: 'Example charge',
    source: token,
  });
});

module.exports = router;
