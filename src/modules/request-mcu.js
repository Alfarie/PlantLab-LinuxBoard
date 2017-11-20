var serial = require('./serial').parser;
var req_sensor = null;
var io = null;
var config = require('../config')
var sensors = require('./sensors')
var port = null;


var changeDateFormat = function(date) {
    var datearr = date.split("/");
    var datestring = datearr[1] + "/" + datearr[0] + "/" + datearr[2];
    return datestring;
}

var setSerial = function(ser, socketio) {
    // serial = ser;
    io = socketio
    serial.on('data', function(data) {
        try {
            var json = JSON.parse(data);
            if (json.type == 'sensor') {
                sensors.shortLogger.push(json.data);
                if (sensors.shortLogger.length >= 50) {
                    sensors.shortLogger.shift();
                }
                io.to('0x01').emit('SENSOR_DATA', json.data);
            } else if (json.type == 'water') {
                io.to('0x01').emit('WATER_STATUS', json.data);
            } else if (json.type == 'pH-control') {
                io.to('0x01').emit('PH_STATUS', json.data);
            } else if (json.type == 'ec-control') {
                io.to('0x01').emit('EC_STATUS', json.data);
            } else if (json.type == 'co2-control') {
                io.to('0x01').emit('CO2_STATUS', json.data);
            } else if (json.type == 'req_setting') {
                io.to('0x01').emit('REP_SETTING', json.data);
            }
        } catch (e) {
            console.log(data);
            // io.to('0x01').emit('ERROR', { "message": "[Error] MCU-Data is not JSON format" });
        }
    });
}


var setWritePort = function(p) {
    port = p;
}

var sendNumber = function() {
    serial.write("Hello mcu");
}

var SendString = function(str) {
    port.write(str);
}

module.exports.setSerial = setSerial;
module.exports.SendString = SendString;
module.exports.setWritePort = setWritePort;