const multer = require('multer');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');

const s3 = new aws.S3();

const storage = multerS3({
  s3: s3,
  bucket: 'point-server',
  acl: 'public-read',
  metadata: function (req, file, cb) {
    cb(null, {fieldName: file.fieldname});
  },
  key: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});
/*
const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, 'uploads/');
  },
  filename: function(req, file, callback) {
    callback(null, new Date().toISOString() + file.originalname);
  }
});
*/
const fileFilter = (req, file, callback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

module.exports = upload;
