function RNG() {

  Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
  }

  var x = Number(Math.floor(Math.random() * Math.floor(999999)).pad(6));
  return x;
}

module.exports = RNG;
