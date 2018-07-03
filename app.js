const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const jwt = require('jsonwebtoken');
const logger = require('morgan');
const path = require('path');
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

const balances = require('./routes/balances');
const index = require('./routes/index');
const merchants = require('./routes/merchants');
const messaging = require('./routes/messaging');
const stripe = require('./routes/stripe');
const users = require('./routes/users');

const app = express();

//Set up mongoose connection
const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB_URI
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Redirect HTTP to HTTPS
app.use(redirectToHTTPS([/localhost:(\d{4})/]));

//View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Log connections to database
const mongoMorgan = require('mongo-morgan');
app.use(mongoMorgan(mongoDB, 'combined', {
  collection: 'logs'
}));

//Log connections to console
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

//Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

//Routes
app.use('/', index);
app.use('/merchants', merchants);
app.use('/users', users);
app.use('/balances', balances);
app.use('/messaging', messaging);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

//Written by Nathan Schwartz (https://github.com/CGTNathan)
