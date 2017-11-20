var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');

// socket.io module --> use io for declare event or emit
var io = require('socket.io')(http);
io = require('./modules/socket-service').InitSocketIO(io);

//module for connect to could
// var client = require('./modules/client-server')

// cors
var cors = require('cors');
app.use(cors())

// serial init --> no implementation on this module (just serial port initialization)
var ser = require('./modules/serial')
var parser = ser.parser;
var port = ser.port;
// global data --> for keep current sensor value, short logger
var sensors = require('./modules/sensors');

// communication part to mcu --> require socket.io and serial
var request_mcu = require('./modules/request-mcu');
request_mcu.setSerial(parser, io); // set serial and socket.io
request_mcu.setWritePort(port)

var logger = require('./modules/datalogger');
logger.start();

var api = require('./modules/api');
app.use('/api/', api);

var root = path.join(path.resolve(__dirname, '../dist'));
app.use(express.static(root));

app.get("/*", function(req, res) {
    res.redirect("/");
});

http.listen(3000, function() {
    console.log('listening *:' + 3000);
});