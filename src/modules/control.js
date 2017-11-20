var serial = null;
var config = require('../config')
var mcu = require('./request-mcu');
var sensors = require('./sensors')

var loopList = [];
for (var i in config.ch_channel.data) {
    loopList.push(null);
}

console.log("LoopList", loopList)
var socket = function(io) {
    io.on('connection', function(socket) {
        console.log("[Control] Client Connected");
        socket.join('0x01');

        socket.on('REQ_CONTROL', function() {
            socket.emit('REP_CONTROL', config.ch_channel);
        });

        socket.on('UPDATE_CONTROL', function(control) {
            console.log(control);
            config.ch_channel = control;

            for (var i in config.ch_channel.data) {
                mcu.gpioOff(i);
                clearInterval(loopList[i]);
                loopList[i] = null;
            }

            setTimeout(checking, 1000);
        })


        socket.on('DATETIME', function(data) {
            console.log(data);
            var cmd = "DATETIME{" + data.day + "," + data.month + "," + (data.year % 2000) + "," + data.hour + "," + data.min + "}";
            console.log(cmd);
            mcu.queue.push(cmd);
        });

        socket.on('disconnect', function() {
            console.log("Client Disconnected");

        });
    });
    return io;
}

var CheckType = function(data) {
    var compare = ['ec', 'ph', 'co2', 'temp', 'vpd', 'soil'];
    var flag = false;
    for (var index in compare) {
        if (data == compare[index]) {
            return true;
        }
    }
    return false;
}

var checking = function() {
    console.log("check", config.ch_channel)
    var ch_checking = config.ch_channel;

    if (ch_checking.total_ch != ch_checking.data.length) {
        console.log("[Error] total_ch not equal to length of data")
        return;
    }

    for (var ch in ch_checking.data) {

        var data = ch_checking.data[ch];

        if (CheckType(data.type)) {
            if (data.working == 0) {
                //setpoint
                console.log("[Control]", data.type, " start", "ch:", ch)
                var detecting = config.ch_channel.data[ch].detecting_time * 1000
                var type = config.ch_channel.data[ch].type
                if (loopList[ch] == null) {
                    setpointLoop(type, ch);
                    loopList[ch] = setInterval(setpointLoop, detecting, type, ch)
                }

            } else if (data.working == 1) {
                //set length
                var type = config.ch_channel.data[ch].type
                if (loopList[ch] == null) {
                    setLengthLoop(type, ch);
                    loopList[ch] = setInterval(setLengthLoop, 1000, type, ch)
                }

            }
        } else if (data.type == 'manual') {
            //send gpio status to 

            var status = (data.data['status']) ? "ON" : "OFF";
            var rch = Number(ch) + 1;
            console.log("[Control]", rch, data.type, " GPIO", status)
            if (data.data['status']) {
                mcu.gpioOn(Number(ch) + 1);
            } else {
                mcu.gpioOff(Number(ch) + 1);
            }
        } else if (data.type == 'timer') {
            timerLoop(ch);
            loopList[ch] = setInterval(timerLoop, 1000, ch);
        }
    }
}

var setpointLoop = function(type, ch) {
    if (sensors.sensors[type] == undefined) {
        console.log("[Control] No", type, "sensor data")
        return;
    }

    var setpoint = config.ch_channel.data[ch].data.start; // setpoint value [start ,end(no use)]
    var method = config.ch_channel.data[ch].method; // method [more,less]
    var sensor = sensors.sensors[type] // sensor value of given type(fn param)
    var detecting = config.ch_channel.data[ch].detecting_time;
    var working = config.ch_channel.data[ch].working_time;

    // console.log(setpoint, method, sensor, detecting, working)
    if (method == 0) {
        //more than
        if (sensor >= setpoint) {
            // gpio on
            mcu.gpioOn(Number(ch) + 1);
            console.log("[Control]", type, sensor, "/", setpoint, " GPIO ON")
            setTimeout(chOff, working * 1000, ch, type)
        }

    } else if (method == 1) {
        //less than
        if (sensor <= setpoint) {
            //gpio on
            mcu.gpioOn(Number(ch) + 1);
            console.log("[Control]", type, sensor, "/", setpoint, " GPIO ON")
            setTimeout(chOff, working * 1000, ch, type)
        }
    }
}


var setLengthLoop = function(type, ch) {
    if (sensors.sensors[type] == undefined) {
        console.log("[Control] No", type, "sensor data")
        return;
    }

    var start = config.ch_channel.data[ch].data.start;
    var end = config.ch_channel.data[ch].data.end;
    var method = config.ch_channel.data[ch].method; // method [more,less]
    var sensor = sensors.sensors[type] // sensor value of given type(fn param)
    var state = config.ch_channel.data[ch].state;
    // console.log(start, end, method, sensor, state)
    if (method == 0) {
        //more
        var A = sensor >= start;
        var B = sensor >= end;

        if (state == 1) {

            if (A & B) {
                //gpio on
                console.log("[Control] SL ", type, start, "<-->", end, sensor, "ON")
                mcu.gpioOn(Number(ch) + 1);
                config.ch_channel.data[ch].state = 2;
            } else {
                //gpio off 
                console.log("[Control] SL ", type, start, "<-->", end, sensor, "OFF")
                mcu.gpioOff(Number(ch) + 1);
            }
        } else if (state == 2) {
            if (!A) {
                //gpio off
                mcu.gpioOff(Number(ch) + 1);
                console.log("[Control] SL ", type, start, "<-->", end, sensor, "OFF")
                config.ch_channel.data[ch].state = 1;
            }
        }
    } else if (method == 1) {
        //less
        var A = sensor <= start;
        var B = sensor <= end;

        if (state == 1) {
            if (A & B) {
                //gpio on
                console.log("[Control] SL ", type, start, "<-->", end, sensor, "ON")
                config.ch_channel.data[ch].state = 2;
            } else {
                //gpio off
                console.log("[Control] SL ", type, start, "<-->", end, sensor, "OFF")
            }
        } else if (state == 2) {
            if (!B) {
                //gpio off
                config.ch_channel.data[ch].state = 1;
            }
        }
    } else {
        console.log("[Control] Error: Unknown method")
        return;
    }

}

var timerLoop = function(ch) {
    if (sensors.sensors['time'] == undefined) {
        console.log("[Control] No", type, "sensor data")
        return;
    }

    var timerList = config.ch_channel.data[ch].data;
    var time = sensors.sensors['time'];
    var timeVal = getTimeValue(time);
    var flag = false;
    var start = null;
    var end = null;
    for (var i in timerList) {
        start = timerList[i].start;
        end = timerList[i].end;

        var startVal = getTimeValue(start);
        var endVal = getTimeValue(end);

        console.log(timeVal, startVal, endVal, (timeVal >= startVal) && (timeVal <= endVal))

        if ((timeVal >= startVal) && (timeVal <= endVal)) {
            flag = true;
            break;
        }
    }

    if (flag) {
        console.log("[Control] TM ", start, "<-->", end, time, "ON")
    } else {
        console.log("[Control] TM ", " No schedule ", time, "OFF")
    }

}

var getTimeValue = function(date) {
    var dateArr = date.split(":");
    var val = Number(dateArr[0]) * 100 + Number(dateArr[1])
    return val;
}

var chOff = function(ch, type) {
    //gpio off
    console.log("[Control]", type, " GPIO OFF", "ch:", ch);
    mcu.gpioOff(Number(ch) + 1);
}

// checking();
setTimeout(checking, 2000);

module.exports.socket = socket