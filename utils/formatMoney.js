module.exports = (input) => {
  if (typeof input == 'number') {
    try {
      var money = String(input);
      let match = money.match(/^(\-)?(\d*?)(\d{1})?(\d{1})$/);
      var output = (match[1] ? match[1] : "") + "$" + (match[2] ? Number(match[2]).toLocaleString() : "0") + "." + (match[3] ? match[3] : "0") + match[4];
      return output;
    } catch (err) {
      return "NaN";
    }
  } else {
    return "NaN";
  }
}
