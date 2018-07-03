const express = require('express');

//api.pointup.io/
const router = express.Router();

//API Documentation

//View document
router.get('/', function(req, res, next) {
  res.render('API', { title: 'Express' });
});

module.exports = router;
