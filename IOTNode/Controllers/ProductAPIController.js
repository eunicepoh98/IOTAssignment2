var express = require('express');
var router = express.Router();
var path = require('path');
var product = require(path.resolve('./APIs/product.js'));

/**
 * [POST]
 * Add Product Key to firebase
 * http://localhost:3000/api/product/
 * Body: JSON(application/json)
 * {
        "productKey": ""
    }
 */
router.post('/', function (req, res) {
    var productKey = req.body.productKey;
    product.addProductKey(productKey)
        .then(function (result) {
            res.send({ success: true, message: result });
        }).catch(function (error) {
            res.send({ success: false, message: error });
        });
});

module.exports = router;
