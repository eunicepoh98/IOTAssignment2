var product = module.exports = {};

var path = require('path');
var firebase = require('firebase');

var rootRef = firebase.database().ref('aneSmartDoorbell');
var productRef = rootRef.child("products");

// add new product key to firebase db
product.addProductKey = function (key) {
    return new Promise(function (resolve, reject) {
        var newProduct = {
            "productKey": key,
            "userKey": ""
        };
        productRef.push(newProduct, function (error) {
            if (error) {
                console.log("Error: " + error);
                reject(error);
            } else {
                resolve("Product Key added");
            }
        });
    });
}

// link the product key to a user
product.linkProductToUser = function (productKey, userKey) {
        productRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneProduct) {
                if (oneProduct.val().productKey == productKey) {
                    productRef.child(oneProduct.key).child("userKey").set(userKey);
                }
            });
        });
}

// Check whether product key is already linked to a user
product.checkProductKey = function (productKey) {
    return new Promise(function (resolve, reject) {
        productRef.once('value', function (snapshot) {
            var available = "Product Key invalid";
            snapshot.forEach(function (oneProduct) {
                if (oneProduct.val().productKey == productKey) {
                    available = "That Product is already registered under another account";
                    if (oneProduct.val().userKey == "") {
                        available = true;
                    }
                }
            });
            resolve(available);
        });
    });
}