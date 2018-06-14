const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const logger = require('morgan');
//const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

const routes = require('./routes');
const index = require('./routes/index');
const users = require('./routes/users');
const merchants = require('./routes/merchants');
const messaging = require('./routes/messaging');
const qr = require('./routes/qr');

const app = express();

//Set up mongoose connection
const mongoose = require('mongoose');
const mongoDB = 'mongodb://admin:' + process.env.MONGO_ATLAS_PW + '@ds255740.mlab.com:55740/pointdb-test';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(redirectToHTTPS([/localhost:(\d{4})/]));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const mongoMorgan = require('mongo-morgan');

app.use(mongoMorgan(mongoDB, 'combined', {
  collection: 'logs'
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use('/', index);
app.use('/users', users);
app.use('/merchants', merchants);
app.use('/messaging', messaging);
app.use('/qr', qr);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, DELETE, GET");
    return res.status(200).json({});
  }
});

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
