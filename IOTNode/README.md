# IOT Assignment2 [AnE Smart Doorbell System]
Notes

### [AWS IOT SDK for Javascript](https://github.com/aws/aws-iot-device-sdk-js#subscribe)
The aws-iot-device-sdk.js package allows developers to write JavaScript applications which access the AWS IoT Platform via MQTT or MQTT over the Secure WebSocket Protocol. It can be used in Node.js environments as well as in browser applications.

### [Node.js Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)
Node.js module to interact with official Telegram Bot API. A bot token is needed, to obtain one, talk to @botfather and create a new bot.
- [Telegram Bot API](https://core.telegram.org/bots/api)

### [Nodemailer](https://github.com/nodemailer/nodemailer)
Send e-mails from Node.js
- [Usage](https://nodemailer.com/about/)

### [Firebase](https://www.npmjs.com/package/firebase)
Firebase SDK for Node.js
- [Firebase Email & Password Authentication](https://firebase.google.com/docs/auth/web/password-auth)

### Create certs folder to store your AWS Certficates
```
. 
|
└─ certs
    ├── certificate.pem.crt
    ├── private.pem.key
    ├── public.pem.key
    └── rootca.pem

```

### Create config.js file
Contents in config.js

```
var config = module.exports = {}

// AWS 
config.aws = {
    host: "", //aws IOT host name
    port: 8883,
}

// Firebase Credentials
config.firebaseCredentials = {
    
}

// Telegram Bot Id
config.telegram = {
    token: "" //telegram bot id
}

// Gmail Credentials
config.gmail = {
    'email': '', //gmail email
    'password': '' //gmail password
}
```