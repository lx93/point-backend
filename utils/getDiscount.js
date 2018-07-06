const validator = require('../utils/validator');

function calculate(amount) {
  var discount = parseFloat(((100-((Math.ceil(amount/1000))-1.00))*.01).toFixed(2));
  if (discount > 1) {
    discount = 1;
  } else if (discount < .85) {
    discount = .85;
  }
  return discount;
}

function get(req, res, next) {
  if (!validator.number(req.body.amount)) {
    console.log('Invalid amount!');
    return res.status(422).json({
      message: "Invalid amount!"
    });
  } else {
    var validAmount = parseInt(req.body.amount);
    const discount = calculate(validAmount);
    validAmount = parseInt(validAmount * discount);
    console.log(validAmount);
    return res.status(200).json({
      discountedAmount: validAmount
    });
  }
}

exports.calculate = calculate;
exports.get = get;
