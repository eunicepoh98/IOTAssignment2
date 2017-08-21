var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
var firebase = require('firebase');

var app = express();

// For BodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
var port = process.env.VCAP_APP_PORT || 3000;

// Initialise Firebase
var firebaseCredentials = require(path.resolve('./config.js')).firebaseCredentials;
firebase.initializeApp(firebaseCredentials);

// Routes
var user = require('./Controllers/UserAPIController');
var product = require('./Controllers/ProductAPIController');
var device = require('./Controllers/DeviceAPIController');

app.use('/api/user', user);
app.use('/api/product', product);
app.use('/api/device', device);

// AWS MQTT and Telegram listener
require(path.resolve('./APIs/pubsub'));

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.listen(port);
console.log('Magic happens on port ' + port);

module.exports = app;
