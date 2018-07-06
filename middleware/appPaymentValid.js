const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getDiscount = require('../utils/getDiscount');
const validator = require('../utils/validator');

function paymentValid(req, res, next) {
  if (!validator.number(req.body.amount) || (req.body.amount < 0)) {
    console.log('Invalid amount!');
    return res.status(422).json({
      message: "Invalid amount!"
    });
  } else {
    var validAmount = parseInt(req.body.amount);
    if (validAmount != 0) {
      if (!req.body.stripeToken) {
        console.log('Invalid stripe token!');
        return res.status(422).json({
          message: "Invalid stripe token!"
        });
      }
      const discount = getDiscount.calculate(validAmount);
      validAmount = parseInt(validAmount * discount);
      //Token is created using Checkout or Elements!
      //Get the payment token ID submitted by the form:
      const token = req.body.stripeToken;     //Using Express

      const charge = stripe.charges.create({
        amount: validAmount,
        currency: 'usd',
        description: 'Example charge',
        source: token,
      }, (err, charge) => {
        if (err) {
          console.log('Charge attempt failed!');
          return res.status(422).json({
            message: "Charge attempt failed!"
          });
        } else {
          req.discount = discount;
          next();
        }
      });
    } else {
      req.discount = null;
      next();
    }
  }
}

module.exports = paymentValid;
