var user = module.exports = {};

var path = require('path');
var firebase = require('firebase');
var moment = require('moment');
var product = require(path.resolve('./APIs/product.js'));
var pubsub = require(path.resolve('./APIs/pubsub.js'));

var rootRef = firebase.database().ref('aneSmartDoorbell');
var userRef = rootRef.child('users');

// Create an account for the user
user.signup = function (useremail, userpassword, productKey) {
    return new Promise(function (resolve, reject) {
        product.checkProductKey(productKey) //check if product available
            .then(function (available) {
                if (available == true) {
                    firebase.auth().createUserWithEmailAndPassword(useremail, userpassword)
                        .then(function (result) { //uid, email, emailVerified
                            result.sendEmailVerification()
                                .then(function () { //send email to user
                                    var newUser = {
                                        "email": result.email,
                                        "productKey": productKey,
                                        "uuid": result.uid,
                                        "telegramChatId": ""
                                    }
                                    var userKey = userRef.push(newUser)
                                        .then(function (data) {
                                            product.linkProductToUser(productKey, data.key);
                                            resolve("Successfully Sign up");
                                        }).catch(function (error) {
                                            console.log("Error: " + error)
                                            reject("Unable to add user");
                                        })
                                }).catch(function (error) { //verification email sent fail
                                    reject("Verification Email not sent");
                                });
                        }).catch(function (error) {
                            console.log(JSON.stringify(error))
                            reject(error.message);
                        });
                } else {
                    reject(available);
                }
            });
    });
} //end of signup()

user.signin = function (useremail, userpassword) {
    return new Promise(function (resolve, reject) {
        firebase.auth().signInWithEmailAndPassword(useremail, userpassword)
            .then(function (result) {
                if (result) {
                    userRef.once('value', function (snapshot) {
                        snapshot.forEach(function (oneUser) {
                            if (oneUser.val().email == useremail) {
                                resolve({ message: "Successfully Signed in", userid: oneUser.key, productkey: oneUser.val().productKey })
                            }
                        })
                    })
                }
            }).catch(function (error) {
                reject(error.message);
            });
    })
}

// get telegram id of product
user.getTelegramId = function (productKey) {
    return new Promise(function (resolve, reject) {
        var gotId = false;
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().productKey == productKey) {
                    resolve(oneUser.val().telegramChatId);
                    gotId = true;
                }
            })
            if (!gotId) { reject; }
        })
    })
}

// update the user telegram id
user.updateTelegramId = function (productKey, telegramId) {
    return new Promise(function (resolve, reject) {
        var updated = false;
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().productKey == productKey) {
                    userRef.child(oneUser.key).child("telegramChatId").set(telegramId);
                    pubsub.sendMessage(telegramId, "Successfully link Telegram Account to your Product", {});
                    updated = true;
                }
            })
            updated ? resolve("Success") : resolve("Failed");
        })
    })
}

// check telegram id link to any product
user.checkTelegramId = function (telegramId) {
    return new Promise(function (resolve, reject) {
        var isLink = false;
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().telegramChatId == telegramId) {
                    isLink = true;
                    resolve(isLink);
                }
            })
            if (!isLink) { resolve(isLink); }
        })
    })
}

// get telegram id of product
user.getProductKey = function (chatId) {
    return new Promise(function (resolve, reject) {
        var gotId = false;
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().telegramChatId == chatId) {
                    resolve(oneUser.val().productKey);
                    gotId = true;
                }
            })
            if (!gotId) { reject; }
        })
    })
}

// add record of button press event to firebase
user.buttonPressed = function (datetime, productKey) {
    return new Promise(function (resolve, reject) {
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().productKey == productKey) {
                    var newRecord = {
                        "datetime": datetime
                    }
                    userRef.child(oneUser.key).child("device").child("button").push(newRecord, function (error) {
                        if (error) {
                            console.log("Error: " + error)
                            reject();
                        } else {
                            resolve();
                        }
                    });
                }
            })
        })
    })
}

// add record of picture taken event to firebase
user.pictureTaken = function (datetime, picturePath, productKey) {
    return new Promise(function (resolve, reject) {
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().productKey == productKey) {
                    var newRecord = {
                        "datetime": datetime,
                        "picturePath": picturePath
                    }
                    userRef.child(oneUser.key).child("device").child("camera").child("picture").push(newRecord, function (error) {
                        if (error) {
                            console.log("Error: " + error)
                            reject();
                        } else {
                            resolve();
                        }
                    });
                }
            })
        })
    })
}

// add record of picture taken event to firebase
user.videoTaken = function (datetime, videoPath, productKey) {
    return new Promise(function (resolve, reject) {
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().productKey == productKey) {
                    var newRecord = {
                        "datetime": datetime,
                        "videoPath": videoPath
                    }
                    userRef.child(oneUser.key).child("device").child("camera").child("video").push(newRecord, function (error) {
                        if (error) {
                            console.log("Error: " + error)
                            reject();
                        } else {
                            resolve();
                        }
                    });
                }
            })
        })
    })
}

// add record of display message event to firebase
user.displayMessage = function (datetime, message, productKey) {
    return new Promise(function (resolve, reject) {
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().productKey == productKey) {
                    var newRecord = {
                        "datetime": datetime,
                        "message": message
                    }
                    userRef.child(oneUser.key).child("device").child("lcd").push(newRecord, function (error) {
                        if (error) {
                            console.log("Error: " + error)
                            reject();
                        } else {
                            resolve();
                        }
                    });
                }
            })
        })
    })
}

// update the led status
user.updateLEDStatus = function (status, productKey) {
    return new Promise(function (resolve, reject) {
        userRef.once('value', function (snapshot) {
            snapshot.forEach(function (oneUser) {
                if (oneUser.val().productKey == productKey) {
                    userRef.child(oneUser.key).child("device").child("led").child("status").set(status);
                    resolve("Updated LED status")
                }
            })
        })
    })
}

// return list of past user photos
user.getUserPhoto = function (userKey) {
    return new Promise(function (resolve, reject) {
        userRef.child(userKey).child("device").child("camera").child("picture").once('value', function (snapshot) {
            var photoList = [];
            snapshot.forEach(function (data) {
                var onePhoto = {
                    "datetime": moment.unix(data.val().datetime).format("dddd, DD MMMM YYYY, h:mm:ss a"),
                    "picturePath": data.val().picturePath
                }
                photoList.push(onePhoto);
            });
            resolve(photoList)
        })
    })
}

// return list of past user video downloadable links
user.getUserVideo = function (userKey) {
    return new Promise(function (resolve, reject) {
        userRef.child(userKey).child("device").child("camera").child("video").once('value', function (snapshot) {
            var videoList = [];
            snapshot.forEach(function (data) {
                var oneVideo = {
                    "datetime": moment.unix(data.val().datetime).format("dddd, DD MMMM YYYY, h:mm:ss a"),
                    "videoPath": data.val().videoPath
                }
                videoList.push(oneVideo);
            });
            resolve(videoList)
        })
    })
}

// return list of user button press history
user.getUserButton = function (userKey) {
    return new Promise(function (resolve, reject) {
        userRef.child(userKey).child("device").child("button").once('value', function (snapshot) {
            var buttonList = [];
            var currentDate, newGrp;
            var existingGrp = false;
            var count = 0;
            snapshot.forEach(function (data) {
                var date = moment.unix(data.val().datetime).format("DD MMM YYYY");
                if (currentDate != date) { //different date as before
                    if (existingGrp) { //second different date
                        newGrp = {
                            "date": currentDate,
                            "count": count
                        }
                        buttonList.push(newGrp)
                        existingGrp = false;
                        count = 1;
                    } else { //first different date
                        currentDate = date;
                        existingGrp = true;
                        newGrp = ""
                        count += 1;
                    }
                } else if (currentDate == date) {
                    count += 1;
                }
            });
            newGrp = {
                "date": currentDate,
                "count": count
            }
            buttonList.push(newGrp)
            resolve(buttonList)
        })
    })
}

// return list of user display message history
user.getUserMessages = function (userKey) {
    return new Promise(function (resolve, reject) {
        userRef.child(userKey).child("device").child("lcd").once('value', function (snapshot) {
            var messageList = [];
            snapshot.forEach(function (data) {
                var oneMessage = {
                    "datetime": moment.unix(data.val().datetime).format("dddd, DD MMMM YYYY, h:mm:ss a"),
                    "message": data.val().message
                }
                messageList.push(oneMessage);
            });
            resolve(messageList)
        })
    })
}

// return status of led
user.getUserLight = function (userKey) {
    return new Promise(function (resolve, reject) {
        userRef.child(userKey).child("device").child("led").child("status").once('value', function (snapshot) {
            resolve(snapshot)
        })
    })
}
