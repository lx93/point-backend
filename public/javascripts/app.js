$(document).ready(function() {

  var app = new Vue({
    el: '#app',
    data: {
      phone: '',
      userpass: '',
      name: '',
      email: '',
      merchantpass: '',
      bphone: '',
      bemail: '',
      balance: ''
    },
    methods: {
      submit1: function() {
        $.post("/users/signup", { phone: app.phone, password: app.userpass });
        //app.console=$.get("/j/users/", {input: app.input});
      },
      submit2: function() {
        $.post("/merchants/delete", { name: app.name, email: app.email, pass: app.merchantpass });
        //app.console=$.get("/j/users/", {input: app.input});
      },
      submit3: function() {
        $.post("/balances/delete", { phone: app.bphone, email: app.bemail, balance: app.balance });
        //app.console=$.get("/j/users/", {input: app.input});
      }
    }
  });
});
