var express = require('express');
var router = express.Router();
var path = require('path');
var user = require(path.resolve('./APIs/user.js'));
var config = require('../config').others;


router.get('/', function (req, res) {
    res.send('Available')
})

/**
 * [POST]
 * Create Account for Users using Firebase Authentication
 * http://localhost:3000/api/user/signup
 * Body: JSON(application/json)
 * {
        "email": "",
        "password": "",
        "productKey": ""
    }
 */
router.post('/signup', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var productKey = req.body.productKey;
    console.log(productKey)
    user.signup(email, password, productKey)
        .then(function (result) {
            res.send({ success: true, message: result });
        }).catch(function (error) {
            res.send({ success: false, message: error });
        });
});

/**
 * [POST]
 * Sign in using Firebase Authentication
 * http://localhost:3000/api/user/signin
 * Body: JSON(application/json)
 * {
        "email": "",
        "password": ""
    }
 */
router.post('/signin', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    user.signin(email, password)
        .then(function (result) {
            res.send({ success: true, message: result.message, userKey: result.userid, productKey: result.productkey });
        }).catch(function (error) {
            res.send({ success: false, message: error });
        });
});

/**
 * [GET]
 * URL that user receive in their email to verify their telegram account
 * http://localhost:8680/verifyemail?productId=&chatId=
 */
router.get('/verifyuser?', function (req, res) {
    var productId = req.query.productId;
    var chatId = req.query.chatId;
    user.updateTelegramId(productId, chatId)
        .then(function (result) {
            res.send(result);
        })
});

module.exports = router;
