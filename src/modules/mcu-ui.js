var serial = null;
var req_sensor = null;
var emit = require('./ui-mcu').emitsubject;
var config = require('../config')
var sensors = require('./sensors')

var subscribtion = require('./serial').mcuMsg.subscribe(
    (data) => {
        try {
            var json = JSON.parse(data);
            if (json.type == 'sensor') {
                sensors.shortLogger.push(json.data);
                if (sensors.shortLogger.length >= 50) {
                    sensors.shortLogger.shift();
                }
                emit.next(['0x01', 'SENSOR_DATA', json.data]);
            } else if (json.type == 'water') {
                emit.next(['0x01', 'WATER_STATUS', json.data]);
            } else if (json.type == 'pH-control') {
                emit.next(['0x01', 'PH_STATUS', json.data]);
            } else if (json.type == 'ec-control') {
                emit.next(['0x01', 'EC_STATUS', json.data]);
            } else if (json.type == 'co2-control') {
                emit.next(['0x01', 'CO2_STATUS', json.data]);
            } else if (json.type == 'req_setting') {
                emit.next(['0x01', 'REP_SETTING', json.data]);
            }
        } catch (e) {
            console.log(data);
        }
    },
    (err) => {},
    () => {}
)