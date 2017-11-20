var portName = require('../config').portName;
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
var fs = require('fs');
var port = null;
var parser = null;
var isConnected = false;
var scanPort = function() {
    var flag = false;
    console.log("[Info] Scanning...")
    for (var i = 20; i >= 0; i--) {
        var str = portName + i;
        if (fs.existsSync(str)) {
            console.log(str);
            port = new SerialPort('/dev/ttyACM0', {
                baudRate: 57600,
                disconnectedCallback: function() { console.log('You pulled the plug!'); }
            });
            parser = port.pipe(new Readline({ delimiter: '\r\n' }));
            port.on('close', (err) => {
                console.log(err);
                isConnected = false;
            })
            flag = true;
            isConnected = true;
            break;
        }
    }
    return flag;
}


scanPort();
setInterval(() => {
    if (!isConnected) {
        scanPort();
    }
}, 1000);




module.exports = {
    port: port,
    parser: parser
}