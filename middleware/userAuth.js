const jwt = require('jsonwebtoken');

function userAuth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userData = decoded;
    next();
  } catch (error) {
    console.log('Auth failed');
    return res.status(401).json({
      message: "Auth failed"
    });
  }
};

module.exports = userAuth;
