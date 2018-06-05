$(document).ready(function() {
  var app = new Vue({
    el: '#app',
    data: {
      image: '',
      balance: ''
    }
    var link = "/qr/"+app.balanceId;
    $.get(link, {}, function(data) {
        app.src.qrcode = data.qrcode;
        app.balance = data.balance
    });
  });
});
