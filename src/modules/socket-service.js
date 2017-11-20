var io = null;
var sensors = require('./sensors')
var reqmcu = require('./request-mcu');

var InitSocketIO = function(socketio) {
    io = socketio;
    io.on('connection', function(socket) {
        console.log("[LINKIT] Client Connected");
        socket.join('0x01');

        socket.on('SHORT_LOGGER_REQ', function() {
            socket.emit('SHORT_LOGGER_REP', sensors.shortLogger);
        });

        socket.on('REQ_SETTING', function() {
            reqmcu.SendString("{cmd, req_setting}");
        });
    });
    return io;
}


module.exports.InitSocketIO = InitSocketIO;