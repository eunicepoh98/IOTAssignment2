var email = module.exports = {};

var path = require("path");
var nodemailer = require("nodemailer");
var gmailConfig = require(path.resolve('./config')).gmail;

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: gmailConfig.email,
        pass: gmailConfig.password
    }
});

// create reusable transporter object using the default SMTP transport
email.sendEmail = function (email, productId, chatId) {
    return new Promise(function (resolve, reject) {
        var host = "https://anesmartdoorbell.au-syd.mybluemix.net"
        link = host + "/api/user/verifyuser?productId=" + productId + "&chatId=" + chatId;

        let mailOptions = {
            to: email,
            subject: 'Link Telegram Account', // Subject line
            html: 'Hi ' + email + ',<br><br>' +
            '<p>Please Click on the link below to link your Product to your Telegram account.<br>' +
            '<a href=' + link + '>Link telegram account</a></p><br><br>' +
            'Best Regards,<br><br>' +
            'AnE Smart Doorbell Team'
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                reject(error.toString())
            }
            resolve("Successfully sent email");
        });
    });
}