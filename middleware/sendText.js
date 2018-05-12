const messaging = require('../utils/messaging');

function sendText(req, res, next) {
  const phone = String(req.body.phone).replace(/[^0-9]/g, "");
  const text = messaging.smsGenerator(req.body.balance, req.merchantData.name, phone);
  messaging.sendSMS(phone, text);
  return res.status(201).json({
    message: "Balance created!"
  });
};

module.exports = sendText;
