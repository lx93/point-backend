const User = require('../models/users');
const Merchant = require('../models/merchants');
const Balance = require('../models/balances');
const mongoose = require('mongoose');

function validateEmail(email) {
  if (email) {
    var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return re.test(String(email).toLowerCase());
  } else {
    return false;
  }
};

function validatePhone(phone) {
  if (phone) {
    var re = /^(1{1})(\d{3})(\d{3})(\d{4})$/;
    return re.test(phone);
  } else {
    return false;
  }
};

function validateString(string) {
  if (string) {
    return (typeof string === 'string' || string instanceof String);
  } else {
    return false;
  }
};

function validateNumber(number) {
  if (typeof parseFloat(number) == 'number') {
    var re = /^(\-)?(\d+)(\.)(\d{2})$/;
    return re.test(number);
  } else {
    return false;
  }
};

exports.email = validateEmail;
exports.phone = validatePhone;
exports.string = validateString;
exports.number = validateNumber;
