var sensors = require('./sensors');
var config = require('../config');
var fs = require('fs');
var loop = null;

var start = function() {
    console.log("LOGGER TIME : " + config.logger_time);
    loop = setInterval(LoggerLoop, config.logger_time);
}

var stop = function() {
    clearInterval(loop);
}


var LoggerLoop = function() {
    var sensor = sensors.sensors;
    if (sensor.date != undefined) {
        var t = sensor.time.split(":");
        var d = sensor.date.split("/");
        var datestr = "DATE" + d[1] + "" + d[0] + "" + d[2];
        // console.log(datestr);
        // var loggerStr = "{\"" + time + "\"," + temp + "," + humi + "," + humi + "," + light + "," + soil + "," + vpd + "},\n";

        // (year, month, day, hours, minutes, seconds, milliseconds)
        // 15,06,08,16,31


        var loggerStr = {
            'datetime': new Date(Number(d[2]), Number(d[1]), 2000 + Number(d[0]), Number(t[0]), Number(t[1]), Number(t[2]), 0).getTime(),
            'time': sensor.time,
            'temp': sensor.temp,
            'humi': sensor.humi,
            'light': sensor.light,
            'soil': sensor.soil,
            'vpd': sensor.vpd
        }
        fs.appendFile(config.rootdir + '/logger/' + datestr, JSON.stringify(loggerStr) + ",\n", function(err) {
            if (err) console.log(err);
            console.log('[LOGGER] saved!');
        })
    }
}


module.exports.start = start;
module.exports.stop = stop;