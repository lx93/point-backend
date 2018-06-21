const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  //Create JWT Token
  const token = jwt.sign(
    {
      firstName: req.userData.firstName,
      lastName: req.userData.lastName,
      dob: req.userData.dob,
      phone: req.userData.phone,
      image: req.userData.image,
      lastLoginAt: req.userData.lastLoginAt,
      createdAt: req.userData.createdAt,
      userId: req.userData._id
    },
    process.env.JWT_KEY,
    {
        expiresIn: "1y"
    }
  );

  //Pass JWT Token
  console.log('Auth successful');
  return res.status(201).json({
    message: "Auth successful",
    token: token
  });
};
