var serial = null;
var config = require('../config')
var setpoint = require('./setpoint');
var detecting = require('./detecting');
var timer = require('./timer');
var sensors = require('./sensors');
var relay = config.manualRelay;
var uicmd = require('./request-mcu')

var UiCommand = function(io) {
    io.on('connection', function(socket) {
        console.log("[LINKIT] Client Connected");
        socket.join('0x01');

        socket.emit('SET_POINT', config.setpoint);
        socket.emit('TIMER', config.timer)
        socket.emit('MANUAL', config.manualRelay);
        socket.emit('MODE', config.mode);
        socket.emit('SETMODE', config.setmode);
        socket.emit('TIMER', config.timer);
        socket.emit('DETECTING', config.detecting);

        socket.on("REQ_SETTING", function(data) {
            var data = {
                'setpoint': config.setpoint,
                'timer': config.timer,
                'manual': config.manualRelay,
                'mode': config.mode,
                'setmode': config.setmode,
                'timer': config.timer,
                'detecting': config.detecting
            }

            socket.emit("REP_SETTING", data);
        })

        //set point 
        socket.on('SET_POINT', function(data) {
            config.setpoint = data;

        });
        socket.on('MODE', function(data) {
            config.mode = data.mode;
            if (config.mode == "AUTO") {

            } else {
                setpoint.stop();
                detecting.stop();
                timer.stop();
                config.setmode = "";
            }
        });

        socket.on('RELAY', function(data) {
            var channel = data.channel;
            var state = data.state;
            config.manualRelay[channel - 1] = state;
            var st = (state) ? 0 : 1;
            var strcmd = "RELAY{" + channel + "," + st + "}";
            // console.log(strcmd);
            uicmd.StopReqSend(strcmd);
        });

        socket.on('SETMODE', function(data) {
            config.setmode = data.setmode;
            if (config.setmode == "SETPOINT") {
                console.log("[SETMODE] START SETPOINT")
                ClearAll();
                setpoint.start();
            }
            if (config.setmode == "DETECTING") {
                console.log("[SETMODE] START DETECTING")
                ClearAll();
                detecting.start();
            }
            if (config.setmode == "TIMER") {
                console.log("[SETMODE] START TIMER")
                ClearAll();
                timer.start();
            } else if (config.setmode == "") {
                console.log("[SETMODE] CLEAR ALL")
                ClearAll();
            }
        });

        socket.on('TIMER', function(data) {
            config.timer = data;

        });

        socket.on('DETECTING', function(data) {
            config.detecting = data;
            config.detecting_req = data[0].detecting * 1000;
            console.log("detecting_req: " + config.detecting_req);
            console.log(config.detecting);
            detecting.stop();
            detecting.start();

        });

        socket.on("DATETIME", function(data) {
            var cmd = "DATETIME{" + data.day + "," + data.month + "," + (data.year % 2000) + "," + data.hour + "," + data.min + "}";;

            console.log(cmd);
            uicmd.StopReqSend(cmd);

        });

        socket.on('disconnect', function() {
            console.log("Client Disconnected");

        });
    });
    return io;
}


var clearGpio = function() {
    for (var i = 1; i < 5; i++) {
        var strcmd = "RELAY{" + Number(i) + "," + 1 + "}";
        uicmd.StopReqSend(strcmd);
    }
}

var ClearAll = function() {
    relay = [false, false, false, false]
    clearGpio();
    setpoint.stop();
    detecting.stop();
    timer.stop();
}


module.exports.socket = UiCommand