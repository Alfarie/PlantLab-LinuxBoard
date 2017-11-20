var io = null;
var sensors = require('./sensors')
var reqmcu = require('./mcu-ui');
var serial = require('./serial');

var Rx = require('rxjs');

var emitsubject = new Rx.Subject();

var InitSocketIO = function(socketio) {
    io = socketio;
    io.on('connection', function(socket) {
        console.log("[LINKIT] Client Connected");
        socket.join('0x01');

        socket.on('SHORT_LOGGER_REQ', function() {
            socket.emit('SHORT_LOGGER_REP', sensors.shortLogger);
        });
        socket.on('REQ_SETTING', function() {
            serial.msgMcuSub.next("{cmd, req_setting}")
        });
    });
    return io;
}
var emitsubscribe = emitsubject.subscribe(
    (data) => {
        io.to(data[0]).emit(data[1], data[2])
    },
    (err) => {},
    () => {}
)
module.exports = {
    InitSocketIO: InitSocketIO,
    io: io,
    emitsubject: emitsubject
}