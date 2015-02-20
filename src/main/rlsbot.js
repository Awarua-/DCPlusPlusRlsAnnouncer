/**
 * Created by Dion on 2/5/2015.
 */
var daysSinceRelease = 16,
    fs,
    nmdc,
    filePath,
    airDate,
    fileSizeInBytes,
    fileName,
    tth;

fs = require("fs");
path = require("path");
nmdc = require("../../lib/nmdc/nmdc");
filePath = process.argv[2];
airDate = process.argv[3];

function shouldAnnounce() {
    var now = new Date().getTime(),
        airDateInMs = Date.parse(airDate),
        daysInMs = daysSinceRelease * 24 * 60 * 60 * 1000;

    if (now < airDateInMs + daysInMs) {
        console.log("good to release");
        getFileName(); //this doesn't feel right
        getFileSize();
        getTTH(release);
        test();
    }
}

function getFileName() {
    fileName = path.basename(filePath);

}

function getFileSize() {
    fileSizeInBytes = fs.statSync(filePath)["size"];
}

function getTTH(callback) {
    var spawn = require('child_process').spawn;
    var prc = spawn('java',  ['-jar', '../../lib/tth/tth.jar', filePath]);

//noinspection JSUnresolvedFunction
    prc.stdout.setEncoding('utf8');
    prc.stdout.on('data', function (data) {
        var str = data.toString();
        var lines = str.replace(/(\r?\n)/g, "");
        var line = lines.match(/^THH:\s+.*$/);
        if (line) {
            tth = line[0].replace(/^THH:\s/, "");
        }
        console.log(lines);
    });

    prc.on('close', function (code) {
        console.log('process exit code ' + code);
        callback();
    });
}

function test() {
    console.log(fileName);
    console.log(fileSizeInBytes);
}

function release() {
    console.log(tth);
    console.log("release");
}
shouldAnnounce();