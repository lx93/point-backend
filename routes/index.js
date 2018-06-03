const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('API', { title: 'Express' });
});

module.exports = router;
