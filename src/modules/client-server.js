var socket = require('socket.io-client')('http://35.186.149.127:3001');
var config = require('../config')
var sensors = require('./sensors')
var fs = require('fs')
var loop = null;
var usid = null;

var relay = config.manualRelay;
var uicmd = require('./request-mcu')

socket.on('connect', function() {
    console.log("[Client-Server] Connected");
    socket.emit('JOIN_DEVICE', { "did": config.did })
});

socket.on('REQ_CONFIG', function(data) {
    console.log("[REQ_CONFIG]");
    console.log(data)

    var usid = data.usid;
    socket.emit('SET_POINT', { 'usid': usid, 'config': config.setpoint });
    socket.emit('TIMER', { 'usid': usid, 'config': config.timer })
    socket.emit('MANUAL', { 'usid': usid, 'config': config.manualRelay });
    socket.emit('MODE', { 'usid': usid, 'config': config.mode });
    socket.emit('SETMODE', { 'usid': usid, 'config': config.setmode });
    socket.emit('DETECTING', { 'usid': usid, 'config': config.detecting });
})

socket.on('ENABLE_STREAM_SENSOR', function(data) {
    usid = data.usid;
    console.log("[Client-Server] ENABLE_STREAM_SENSOR")
    stop();
    start();
});

socket.on('DISABLE_STREAM_SENSOR', function() {
    console.log("[Client-Server] DISABLE_STREAM_SENSOR");
    stop();
});

socket.on('disconnect', function() {
    console.log("[Client-Server] disconnected")
});

var start = function() {
    console.log("START STREAM")
    clearInterval(loop);
    loop = setInterval(streamSensor, 3000);
}

var stop = function() {
        console.log("STOP STREAM")
        clearInterval(loop);
    }
    // { time: '06:28:10',
    //   date: '08/01/15',
    //   temp: 31.41,
    //   humi: 72.42,
    //   light: 4,
    //   soil: 70.14,
    //   vpd: 1267.93 }
var streamSensor = function() {
    var sensor = sensors.sensors;
    if (sensor.time != undefined) {
        var data = {
            'time': sensor.time,
            'date': sensor.date,
            'humi': sensor.humi,
            'light': sensor.light,
            'soil': sensor.soil,
            'vpd': sensor.vpd,
            'usid': usid,
            'temp': sensor.temp
        }
        socket.emit('STREAM_SENSOR', data)
    }
}



socket.on("DATETIME", function(data) {
    var cmd = "DATETIME{" + data.day + "," + data.month + "," + (data.year % 2000) + "," + data.hour + "," + data.min + "}";;

    console.log(cmd);
    uicmd.StopReqSend(cmd);

});

socket.on('REQ_LOGGER_DATE', function(data) {
    // var data = {
    //                     'usid': usid,
    //                     'data': filename
    //                 }

    var date = data.data;
    console.log(data)
    try {
        var buffer = fs.readFileSync(config.rootdir + '/logger/' + date);
        var str = buffer.toString();

        str = str.substring(0, str.length - 2);
        str = "[" + str + "]";
        tstr = str.trim(",\n");

        var jstr = JSON.parse(tstr);
        delete jstr, str;
        socket.emit('REP_LOGGER_DATE', { 'usid': data.usid, 'data': jstr })
    } catch (error) {

    }
})

socket.on('REQ_CHECK_DATE', function(data) {
    /*{
      'usid': usid,
      'data': my
     }*/
    console.log("REQ_CHECK_DATE", data);
    var MY = data.data;
    var dateList = [];

    fs.readdir(config.rootdir + "/logger/", function(err, files) {
        try {
            files.forEach(function(file) {
                if (file.substring(6, file.length) == MY) {
                    var str = file.replace("DATE", "");
                    str = str[0] + str[1] + "-" + str[2] + str[3] + "-" + str[4] + str[5];
                    var list = {
                        "name": str,
                        "val": file
                    }
                    dateList.push(list);
                }
            });
            // res.json(dateList);
            socket.emit('REP_CHECK_DATE', { 'usid': data.usid, 'data': dateList })
            delete dateList;
        } catch (ex) {
            socket.emit('REP_CHECK_DATE', { 'usid': data.usid, 'data': [] })
        }
    });
});

socket.on('disconnect', function() {
    console.log("Client Disconnected");

});


module.exports = socket