const nodemailer = require('nodemailer');

function sendEmail(dst, text) {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pointup@gmail.com',
      pass: 'admin'
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
