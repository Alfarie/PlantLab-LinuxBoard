var express = require('express')
var config = require('../config');
var sensors = require('./sensors')
var router = express.Router();
var fs = require('fs');


router.get('/control', function(req, res) {

    var data = config.ch_channel;
    res.json(data);
})

router.get('/getdata', function(req, res) {
    var qstr = req.query;

    if (qstr.date == undefined) {
        res.json({ "status": "query error" })
        return;
    }

    var date = qstr.date;
    try {
        var buffer = fs.readFileSync(config.rootdir + '/logger/' + date);
        var str = buffer.toString();

        str = str.substring(0, str.length - 2);
        str = "[" + str + "]";
        tstr = str.trim(",\n");

        var jstr = JSON.parse(tstr);
        delete jstr, str;
        res.json(jstr);

    } catch (error) {
        res.json({ "status": "Error", "description": "No record" })
    }
});

router.get('/checkdate', function(req, res) {
    if (req.query.my == undefined) {
        res.json({ "status": "invalid request format" });
        return;
    }

    var MY = req.query.my;
    var dateList = [];

    fs.readdir(config.rootdir + "/logger/", function(err, files) {
        try {
            files.forEach(function(file) {
                if (file.substring(6, file.length) == MY) {
                    var str = file.replace("DATE", "");
                    str = str[0] + str[1] + "-" + str[2] + str[3] + "-" + str[4] + str[5];
                    var list = {
                        "name": str,
                        "val": file
                    }
                    dateList.push(list);
                }
            });

            res.json(dateList);
            delete dateList;
            res.end();
        } catch (ex) {
            res.json([])
        }

    });
})

router.get('/shortlogger', function(req, res) {
    res.json(sensors.shortLogger);
})

module.exports = router;