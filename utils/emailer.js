const nodemailer = require('nodemailer');

function sendEmail(dst, text) {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'xli@pointup.io',
      pass: process.env.EMAIL_KEY
    }
  });

  var mailOptions = {
    from: 'pointup@gmail.com',
    to: dst,
    subject: 'Pointup Verification',
    text: text
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}
