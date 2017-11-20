var fs = require('fs');

module.exports.rootdir = __dirname.replace("/src", "");
module.exports.portName = '/dev/ttyACM';
module.exports.urlServer = "http://localhost";
module.exports.portServer = 3001;
module.exports.did = 'GROBOTG03'
module.exports.req_sensor_time = 1500;
module.exports.setpoint_req = 1000;
module.exports.detecting_req = 5000;
module.exports.timer_req = 1000;
module.exports.logger_time = 1000 * 60 * 5;

module.exports.port = 3000;

var timer = {
    type: 'timer',
    data: [{
        start: "01:10",
        end: "02:50"
    }]
}

var ec = {
    type: 'ec',
    data: {
        start: 1.02,
        end: 1.5
    },
    working: 0, // [setpoint, setlength]
    method: 1, // [more than, less than]
    detecting_time: 10,
    working_time: 5,
    state: 1
}

var ph = {
    type: 'ph',
    data: {
        start: 4.0,
        end: 5.58
    },
    working: 0, // [setpoint, setlength]
    method: 0, // [more than, less than]
    detecting_time: 10,
    working_time: 5,
    state: 1
}

var co2 = {
    type: 'co2',
    data: {
        start: 800,
        end: 1000
    },
    working: 0, // [setpoin, setlength]
    method: 1, // [more than, less than]
    detecting_time: 10,
    working_time: 5,
    state: 1
}

var temp = {
    type: 'temp',
    data: {
        start: 25,
        end: 30
    },
    working: 1,
    method: 0, // [more than, less than]
    detecting_time: 10,
    working_time: 5,
    state: 1
}

var soil = {
    type: 'soil',
    data: {
        start: 50,
        end: 60
    },
    working: 1, // [setpoin, setlength]
    method: 1, // [more than, less than]
    detecting_time: 10,
    working_time: 5,
    state: 1
}

var vpd = {
    type: 'vpd',
    data: {
        start: 2000,
        end: 2300
    },
    working: 1,
    method: 0, // [more than, less than]
    detecting_time: 10,
    working_time: 5,
    state: 1
}

var manual = {
    type: 'manual',
    data: {
        status: false
    }
}

module.exports.ch_channel = {
    total_ch: 4,
    data: [
        manual, manual, manual, manual
    ]
}

module.exports.saveConfigFile = function() {
    console.log("[Config] Could not read config.json")
    fs.writeFileSync(__dirname.replace("/src", "") + "/config.json", JSON.stringify(module.exports))
    console.log("[Config] config.json writed")
}
readConfigFile = function() {
    try {
        var datafile = fs.readFileSync(__dirname.replace("/src", "") + "/config.json");
        var data = JSON.parse(datafile.toString());
        console.log("[Config] Load json file...");
        module.exports = data;
    } catch (ex) {
        console.log("[Config] Could not read config.json")
        fs.writeFileSync(__dirname.replace("/src", "") + "/config.json", JSON.stringify(module.exports))
        console.log("[Config] config.json writed")
    }
}

// readConfigFile();
// module.exports.saveConfigFile();