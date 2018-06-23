const md5 = require('md5');
const RNG = require('./RNG');

function hashBalance(balanceId) {
  var salt = RNG();
  var string = balanceId+salt;

  var hash = md5(string);
  return hash;
}

module.exports = hashBalance;
