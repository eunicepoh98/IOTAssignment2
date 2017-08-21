# coding: utf8
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
from gpiozero import Button, Buzzer, LED
from rpi_lcd import LCD
from picamera import PiCamera
from signal import pause
from datetime import datetime
import calendar
from time import sleep
import json
import boto3
import botocore
import time
import subprocess
import shlex
import os
import awscredentials

camera = PiCamera()
bz = Buzzer(6)
led = LED(18)
lcd = LCD()
button = Button(5, pull_up=False)

# Set the filename and bucket name
bucket_name = 'anesmartdoorbell'  # replace with your own unique bucket name
region = 'ap-southeast-1'
exists = True
spam = False
start = time.time()

host = "a3t0nm0d0jd547.iot.us-west-2.amazonaws.com"
rootCAPath = "certs/rootca.pem"
certificatePath = "certs/certificate.pem.crt"
privateKeyPath = "certs/private.pem.key"
accessKey = awscredentials.accessKey
secretAccessKey = awscredentials.secretAccessKey
productKey = "A1B2C3"

# Create an S3 resource
s3 = boto3.resource('s3', aws_access_key_id=accessKey,
                    aws_secret_access_key=secretAccessKey)


def onLight():
    led.on()


def offLight():
    led.off()


def lcdWrite(message):
    lcd.text(message[:16], 1)
    lcd.text(message[16:32], 2)


def lcdClear():
    lcd.clear()


def doorbellPressed():
    global productKey, start, spam
    bz.on()
    if (spam == False):
        takePicture()
        start = time.time()
        d = datetime.utcnow()
        timestamp = calendar.timegm(d.utctimetuple())
        payload = json.dumps({
            "device": "button",
            "productKey": productKey,
            "action": "button_pressed",
            "data": {
                "datetime": timestamp
            }
        })
        my_rpi.publish("anedingding/" + productKey + "/button", payload, 1)
        spam = True
    else:
        difference = time.time() - start
        if(difference > 10):
            spam = False
            start = time.time()


def doorbellRelease():
    bz.off()


def takePicture():
    global region, productKey, bucket_name
    print("taking picture")
    d = datetime.utcnow()
    timestamp = calendar.timegm(d.utctimetuple())
    file_name = "{}.jpg".format(timestamp)
    camera.capture("pictures/" + file_name)
    full_path = "{}/{}".format(productKey, file_name)

    # Upload picture to s3
    s3.Bucket(bucket_name).put_object(Key=full_path,
                                      Body=open("pictures/" + file_name, 'rb'))
    picturePath = "".join(
        ["https://s3-", region, ".amazonaws.com/", bucket_name, "/", full_path])
    payload = json.dumps({
        "device": "camera",
        "productKey": productKey,
        "action": "picture_taken",
        "data": {
            "datetime": timestamp,
            "picturePath": picturePath
        }
    })
    my_rpi.publish("anedingding/" + productKey + "/camera", payload, 1)
    print("File uploaded")


def takeVideo():
    global region, productKey, bucket_name
    d = datetime.utcnow()
    timestamp = calendar.timegm(d.utctimetuple())
    file_name = "{}.h264".format(timestamp)
    new_file_name = "{}.mp4".format(timestamp)
    full_path = "{}/{}".format(productKey, new_file_name)
    camera.start_recording("videos/" + file_name)
    sleep(8)
    camera.stop_recording()
    video_save_path = os.path.dirname(os.path.realpath(
        __file__)) + "/videos/{}".format(file_name)

    # Convert video to mp4 format
    from subprocess import CalledProcessError
    command = "MP4Box -add {} videos/{}".format(video_save_path, new_file_name)
    try:
        output = subprocess.check_output(
            command, stderr=subprocess.STDOUT, shell=True)
        subprocess.Popen("rm {}".format(video_save_path),
                         shell=True)  # Delete the h264 video
    except CalledProcessError as e:
        print('FAIL:\ncmd:{}\noutput:{}'.format(e.cmd, e.output))

    # Upload video to s3
    s3.Bucket(bucket_name).put_object(Key=full_path,
                                      Body=open("videos/" + new_file_name, 'rb'))
    videoPath = "".join(
        ["https://s3-", region, ".amazonaws.com/", bucket_name, "/", full_path])
    payload = json.dumps({
        "device": "camera",
        "productKey": productKey,
        "action": "video_taken",
        "data": {
            "datetime": timestamp,
            "videoPath": videoPath
        }
    })
    my_rpi.publish("anedingding/" + productKey + "/camera", payload, 1)


def customCallback(client, userdata, message):
    global productKey
    print("Received a new message: ")
    print(json.loads(message.payload))
    print("from topic: {}".format(message.topic))
    print("‐‐‐‐‐‐‐‐‐‐‐‐‐‐\n\n")

    payloadData = json.loads(message.payload)
    action = payloadData["action"]
    device = payloadData["device"]

    if (device == "led"):
        if(action == "on_led"):
            onLight()
            payload = json.dumps({
                "device": "led",
                "productKey": productKey,
                "action": "led_on"
            })
            my_rpi.publish("anedingding/" + productKey + "/led", payload, 1)

        elif (action == "off_led"):
            offLight()
            payload = json.dumps({
                "device": "led",
                "productKey": productKey,
                "action": "led_off"
            })
            my_rpi.publish("anedingding/" + productKey + "/led", payload, 1)

    elif (device == "lcd"):
        if (action == "display_message"):
            message = str(payloadData["data"]["message"])
            lcdWrite(message)
            payload = json.dumps({
                "device": "lcd",
                "productKey": productKey,
                "action": "message_display",
                "data": {
                    "message": message,
                    "datetime": str(payloadData["data"]["datetime"])
                }
            })
            my_rpi.publish("anedingding/" + productKey + "/lcd", payload, 1)

        elif (action == "clear_message"):
            lcdClear()
            payload = json.dumps({
                "device": "lcd",
                "productKey": productKey,
                "action": "message_clear"
            })
            my_rpi.publish("anedingding/" + productKey + "/lcd", payload, 1)

    elif (device == "camera"):
        if (action == "take_picture"):
            takePicture()
        elif (action == "take_video"):
            takeVideo()


try:
    s3.meta.client.head_bucket(Bucket=bucket_name)
except botocore.exceptions.ClientError as e:
    error_code = int(e.response['Error']['Code'])
    if error_code == 404:
        exists = False

if exists == False:
    # Create the bucket policy
    bucket_policy = json.dumps({
        "Version": "2008-10-17",
        "Statement": [
            {
                "Sid": "AllowPublicRead",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "*"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::%s/*/*" % bucket_name
            }
        ]
    })
    s3.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={
                     'LocationConstraint': region})
    # Create an S3 client
    s3client = boto3.client('s3', aws_access_key_id=accessKey,
                            aws_secret_access_key=secretAccessKey)
    # Set the new policy on the given bucket
    s3.put_bucket_policy(Bucket=bucket_name, Policy=bucket_policy)
    print("S3 bucket created")

my_rpi = AWSIoTMQTTClient(productKey)
my_rpi.configureEndpoint(host, 8883)
my_rpi.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

my_rpi.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
my_rpi.configureDrainingFrequency(2)  # Draining: 2 Hz
my_rpi.configureConnectDisconnectTimeout(10)  # 10 sec
my_rpi.configureMQTTOperationTimeout(5)  # 5 sec

# Connect and subscribe to AWS IoT 
my_rpi.connect()
my_rpi.subscribe("anedongdong/" + productKey + "/#", 1, customCallback)
print("Subscribed")

button.when_pressed = doorbellPressed
button.when_released = doorbellRelease

pause()
