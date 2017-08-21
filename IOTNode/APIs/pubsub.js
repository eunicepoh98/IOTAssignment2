var pubsub = module.exports = {};

var awsIot = require('aws-iot-device-sdk');
var TelegramBot = require('node-telegram-bot-api');
var path = require("path");
var firebase = require('firebase');

var config = require(path.resolve('./config')).aws;
var telegramToken = require(path.resolve('./config.js')).telegram.token;

var email = require(path.resolve('./APIs/email.js'));
var user = require(path.resolve("./APIs/user.js"));
var product = require(path.resolve("./APIs/product.js"));

var telegram = new TelegramBot(telegramToken, { polling: true });
var rootRef = firebase.database().ref('aneSmartDoorbell');
var userRef = rootRef.child('users');
var productRef = rootRef.child('products');

// send telegram message
pubsub.sendMessage = function (chatId, message, options) {
    telegram.sendMessage(chatId, message, options)
        .catch(function (error) {
            console.log(error)
        });
}

//Listen for any kind of message.There are different kinds of
//messages.
telegram.on('message', (msg) => {
    var chatId = msg.chat.id;
    var userMsg = msg.text;

    if (userMsg.match(/\/link (.+)|\/link/)) { // check product key availble and link it to user by sending an email to them
        var productKey = userMsg.match(/\/link (.+)|\/link/)[1];
        if (productKey) {
            product.checkProductKey(productKey)
                .then(function (available) {
                    if (available == true) { // no user link to product
                        pubsub.sendMessage(chatId, 'An account have not been created for that ProductKey. Please create an account before linking your telegram account to the product.', {});
                    } else if (available == "Product Key invalid") { //no such product keys
                        pubsub.sendMessage(chatId, available, {});
                    } else { // product key is linked to a user
                        userRef.on('value', function (snapshot) {
                            snapshot.forEach(function (oneUser) {
                                if (oneUser.val().productKey == productKey) {
                                    if (oneUser.val().telegramChatId == "") {
                                        //send email
                                        email.sendEmail(oneUser.val().email, productKey, chatId).then(function () {
                                            pubsub.sendMessage(chatId, 'A verification email have been sent to the email linked to that ProductKey', {});
                                        })
                                    } else {
                                        pubsub.sendMessage(chatId, 'That Product is already linked to another Telegram Account', {});
                                    }
                                }
                            })
                        })
                    }
                })
        } else {
            pubsub.sendMessage(chatId, 'Try /link <Product Key>', {});
        }
    } else {
        user.checkTelegramId(chatId).then(function (isLink) { // check if user is already a user
            if (isLink) {
                if (userMsg.match(/\/start/)) {
                    pubsub.sendMessage(chatId, 'Hi, I am AnE Smart Doorbell Bot.\n\n'
                        + 'Link your Smart Doorbell Product to your telegram account:'
                        + '\n/link <ProductKey>\n\n'
                        + 'On Lights:\n/onlight\n\n'
                        + 'Off Lights:\n/offlight\n\n'
                        + 'Display Message: (32 char limit)\n/displaymessage <message>'
                        + '\n\nClear Message:\n/clearmessage'
                        + '\n\nTake Photo:\n/picture'
                        + '\n\nTake a 8s Video:\n/video', {});
                } else if (userMsg.match(/\/picture|Take Picture/i)) { // publish to take a picture
                    user.getProductKey(chatId).then(function (productKey) {
                        var data = {
                            "device": "camera",
                            "productKey": productKey,
                            "action": "take_picture"
                        }
                        device.publish('anedongdong/' + productKey + "/camera", JSON.stringify(data));
                        pubsub.sendMessage(chatId, "Taking photo...", {});
                    })
                } else if (userMsg.match(/\/onlight|On Light/i)) { // publish to on led
                    user.getProductKey(chatId).then(function (productKey) {
                        var data = {
                            "device": "led",
                            "productKey": productKey,
                            "action": "on_led"
                        }
                        device.publish('anedongdong/' + productKey + "/led", JSON.stringify(data));
                        pubsub.sendMessage(chatId, "Turning On Light..", {});
                    })
                } else if (userMsg.match(/\/offlight|Off Light/i)) { // publish to off led
                    user.getProductKey(chatId).then(function (productKey) {
                        var data = {
                            "device": "led",
                            "productKey": productKey,
                            "action": "off_led"
                        }
                        device.publish('anedongdong/' + productKey + "/led", JSON.stringify(data));
                        pubsub.sendMessage(chatId, "Turning Off Light..", {});
                    })
                } else if (userMsg.match(/\/displaymessage (.+)|Display a Message|\/displaymessage|display message/i)) { // publish to display message
                    var message = userMsg.match(/\/displaymessage (.+)|Display a Message|\/displaymessage|display message/i)[1];
                    if (message) {
                        user.getProductKey(chatId).then(function (productKey) {
                            var datetime = Math.round((new Date()).getTime() / 1000)
                            var data = {
                                "device": "lcd",
                                "productKey": productKey,
                                "action": "display_message",
                                "data": {
                                    "message": message,
                                    "datetime": datetime
                                }
                            }
                            device.publish('anedongdong/' + productKey + "/lcd", JSON.stringify(data));
                            pubsub.sendMessage(chatId, "Displaying Message", {});
                        })
                    } else {
                        pubsub.sendMessage(msg.chat.id, "Ok! Please key in the display message in this format: (32 Char limit) /displaymessage <Your Message>", {});
                    }
                } else if (userMsg.match(/\/dosomething/i)) { // display list of things the user can do
                    let replyOptions = {
                        reply_markup: {
                            resize_keyboard: true,
                            one_time_keyboard: true,
                            keyboard: [
                                ['Take Picture'],
                                ['Take Video'],
                                ['Display a Message'],
                                ['Clear Message'],
                                ['On Light'],
                                ["Off Light"]
                            ],
                        },
                    };
                    pubsub.sendMessage(chatId, "What do you want to do?", replyOptions);
                } else if (userMsg.match(/\/video|Take Video/i)) { // publish to take a video
                    user.getProductKey(chatId).then(function (productKey) {
                        var data = {
                            "device": "camera",
                            "productKey": productKey,
                            "action": "take_video"
                        }
                        device.publish('anedongdong/' + productKey + "/camera", JSON.stringify(data));
                        pubsub.sendMessage(chatId, "Taking Video...", {});
                    })
                } else if (userMsg.match(/\/clearmessage|Clear Message/i)) { // publish to clear lcd message
                    user.getProductKey(chatId).then(function (productKey) {
                        var data = {
                            "device": "lcd",
                            "productKey": productKey,
                            "action": "clear_message"
                        }
                        device.publish('anedongdong/' + productKey + "/lcd", JSON.stringify(data));
                        pubsub.sendMessage(chatId, "Clearing Message", {});
                    })
                } else {
                    pubsub.sendMessage(chatId, 'Try these instead\n\n'
                        + 'On Lights:\n/onlight\n\n'
                        + 'Off Lights:\n/offlight\n\n'
                        + 'Display Message: (32 char limit)\n/displaymessage <message>'
                        + '\n\nClear Message:\n/clearmessage'
                        + '\n\nTake Photo:\n/picture'
                        + '\n\nTake a 8s Video:\n/video', {});
                }
            } else {
                pubsub.sendMessage(chatId, 'Your Telegram account is not linked to any of our products\n /link <ProductKey> to link your account', {});
            }
        })
    }
});

var device = awsIot.device({
    keyPath: './certs/private.pem.key',
    certPath: './certs/certificate.pem.crt',
    caPath: './certs/rootca.pem',
    clientId: "anedingdong",
    host: config.host
});

device.on('connect', function () {
    console.log('MQTT connected');
    device.subscribe('anedingding/#');
});

device.on('message', function (topic, payload) {
    var payloadData = JSON.parse(payload)
    var productKey = payloadData.productKey;
    var action = payloadData.action;
    user.getTelegramId(productKey).then(function (chatId) {
        switch (action) {
            case "button_pressed": { //send telegram message and save to firebase
                var datetime = payloadData.data.datetime;
                user.buttonPressed(datetime, productKey).then(function () {
                    let replyOptions = {
                        reply_markup: {
                            resize_keyboard: true,
                            one_time_keyboard: true,
                            keyboard: [
                                ['Take Video'],
                                ['Display a Message']
                            ],
                        },
                    };
                    pubsub.sendMessage(chatId, 'Someone has pressed your doorbell, what do you want to do?', replyOptions);
                })
                break;
            }
            case "led_on": {
                user.updateLEDStatus("on", productKey).then(function () { })
                pubsub.sendMessage(chatId, 'Lights are On', {});
                break;
            }
            case "led_off": {
                user.updateLEDStatus("off", productKey).then(function () { })
                pubsub.sendMessage(chatId, 'Lights are Off', {});
                break;
            }
            case "message_display": {
                var datetime = payloadData.data.datetime;
                var message = payloadData.data.message;
                user.displayMessage(datetime, message, productKey).then(function () { })
                pubsub.sendMessage(chatId, 'Message Displayed', {});
                break;
            }
            case "picture_taken": {
                var picturePath = payloadData.data.picturePath;
                var datetime = payloadData.data.datetime;
                user.pictureTaken(datetime, picturePath, productKey).then(function () {
                    telegram.sendPhoto(chatId, picturePath, {
                        caption: "Photo taken"
                    }).catch(function (error) {
                        console.log(error)
                    });
                })
                break;
            }
            case "video_taken": {
                var videoPath = payloadData.data.videoPath;
                var datetime = payloadData.data.datetime;
                user.videoTaken(datetime, videoPath, productKey).then(function () {
                    telegram.sendDocument(chatId, videoPath, {
                        caption: "Video taken"
                    }).catch(function (error) {
                        console.log(error)
                    });
                })
                break;
            }
            case "message_clear": {
                pubsub.sendMessage(chatId, 'Message Cleared', {});
                break;
            }
        }
    })
});

