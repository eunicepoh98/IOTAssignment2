# coding: utf8
import gevent
import gevent.monkey
from gevent.pywsgi import WSGIServer
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import json
from datetime import datetime
import calendar

gevent.monkey.patch_all()

from flask import Flask, request, Response, render_template, jsonify

app = Flask(__name__)

host = "a3t0nm0d0jd547.iot.us-west-2.amazonaws.com"
rootCAPath = "certs/rootca.pem"
certificatePath = "certs/certificate.pem.crt"
privateKeyPath = "certs/private.pem.key"

my_rpi = AWSIoTMQTTClient("anesmartdoorbellweb")
my_rpi.configureEndpoint(host, 8883)
my_rpi.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

my_rpi.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
my_rpi.configureDrainingFrequency(2)  # Draining: 2 Hz
my_rpi.configureConnectDisconnectTimeout(10)  # 10 sec
my_rpi.configureMQTTOperationTimeout(5)  # 5 sec

my_rpi.connect()

########### Views ###########


@app.route("/")
def welcome():
    return render_template('welcome.html')


@app.route("/login")
def login():
    return render_template('login.html')


@app.route("/register")
def register():
    return render_template('register.html')


@app.route("/dashboard")
def dashboard():
    templateData = {
        'title': 'Dashboard',
        'main': 'AnE Smart Doorbell'
    }
    return render_template('dashboard.html', **templateData)


@app.route("/picture")
def picture():
    templateData = {
        'title': 'Pictures',
        'main': 'AnE Smart Doorbell'
    }
    return render_template('picture.html', **templateData)


@app.route("/light")
def light():
    templateData = {
        'title': 'Lights',
        'main': 'AnE Smart Doorbell'
    }
    return render_template('light.html', **templateData)


@app.route("/message")
def message():
    templateData = {
        'title': 'Display Message',
        'main': 'AnE Smart Doorbell'
    }
    return render_template('lcd.html', **templateData)

@app.route("/led", methods=["POST"])
def led():
    data = json.loads(request.data)
    if (data["status"] == "on"):
        payload=json.dumps({
            "device": "led",
            "productKey": data["productKey"],
            "action": "on_led"
        })
        my_rpi.publish("anedongdong/" + data["productKey"] + "/led", payload, 1)
    elif (data["status"] == "off"):
        payload=json.dumps({
            "device": "led",
            "productKey": data["productKey"],
            "action": "off_led"
        })
        my_rpi.publish("anedongdong/" + data["productKey"] + "/led", payload, 1)
    return "done"

@app.route("/camera", methods=["POST"])
def camera():
    data = json.loads(request.data)
    if (data["action"] == "picture"):
        payload=json.dumps({
            "device": "camera",
            "productKey": data["productKey"],
            "action": "take_picture"
        })
        my_rpi.publish("anedongdong/" + data["productKey"] + "/camera", payload, 1)
    elif (data["action"] == "video"):
        payload=json.dumps({
            "device": "camera",
            "productKey": data["productKey"],
            "action": "take_video"
        })
        my_rpi.publish("anedongdong/" + data["productKey"] + "/camera", payload, 1)
    return "done"

@app.route("/lcd", methods=["POST"])
def lcd():
    data = json.loads(request.data)
    if (data["action"] == "clear"):
        payload=json.dumps({
            "device": "lcd",
            "productKey": data["productKey"],
            "action": "clear_message"
        })
        my_rpi.publish("anedongdong/" + data["productKey"] + "/lcd", payload, 1)
    elif (data["action"] == "display"):
        d = datetime.utcnow()
        timestamp = calendar.timegm(d.utctimetuple())
        payload=json.dumps({
            "device": "lcd",
            "productKey": data["productKey"],
            "action": "display_message",
            "data": {
                "message": data["message"],
                "datetime": timestamp
            }
        })
        my_rpi.publish("anedongdong/" + data["productKey"] + "/lcd", payload, 1)
    return "done"


if __name__ == '__main__':
    try:
        http_server = WSGIServer(('0.0.0.0', 8001), app)
        app.debug = True
        print("Web page running on port 8001")
        http_server.serve_forever()
    except:
        print("Exception")
