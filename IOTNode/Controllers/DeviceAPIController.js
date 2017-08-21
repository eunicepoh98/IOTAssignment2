var express = require('express');
var router = express.Router();
var path = require('path');
var user = require(path.resolve('./APIs/user.js'));

/**
 * [GET]
 * Return list of photos taken
 * http://localhost:8680/api/device/photo
 */
router.get('/photo', function (req, res) {
    user.getUserPhoto(req.headers.userkey).then(function (result) {
        res.send({ success: true, data: result })
    })
})

/**
 * [GET]
 * Return list of videos taken
 * http://localhost:8680/api/device/video
 */
router.get('/video', function (req, res) {
    user.getUserVideo(req.headers.userkey).then(function (result) {
        res.send({ success: true, data: result })
    })
})

/**
 * [GET]
 * Return list of button pressed info
 * http://localhost:8680/api/device/button
 */
router.get('/button', function (req, res) {
    user.getUserButton(req.headers.userkey).then(function (result) {
        res.send({ success: true, data: result })
    })
})

/**
 * [GET]
 * Return list of displayed messages
 * http://localhost:8680/api/device/message
 */
router.get('/message', function (req, res) {
    user.getUserMessages(req.headers.userkey).then(function (result) {
        res.send({ success: true, data: result })
    })
})

/**
 * [GET]
 * Return status of led
 * http://localhost:8680/api/device/led
 */
router.get('/led', function (req, res) {
    data.getUserLight(req.headers.userkey).then(function (result) {
        res.send({ success: true, data: result })
    })
})

module.exports = router