/**
 * Created by Dion on 2/5/2015.
 */
var daysSinceRelease = 16,
    fs,
    nmdc,
    filePath,
    airDate,
    tth = null,
    magnetic_link,
    reltype,
    hub;

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
        getFileSize();
        getTTH(release);
    }
    else {
	    console.log("Air date of release is old don't release.");
        console.log(airDate);
        console.log(now);
        console.log(airDateInMs + daysInMs);
    }
}

function getFileNameForLink() {
    var fileName = path.basename(filePath);
    fileName = fileName.replace(/ /g, '+');
    fileName = fileName.replace(/,/g, '%2C');
    return fileName;
}

function getFileName() {
    return path.basename(filePath);
}

function getFileSize() {
     return parseInt(fs.statSync(filePath)["size"]);
}

function getTTH(callback) {
    var spawn = require('child_process').spawn;
    var prc = spawn('java',  ['-jar', path.resolve(__dirname, '../../lib/tth/tth.jar'), filePath]);
    console.log(filePath);

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

    prc.stderr.setEncoding('utf8');
    prc.stderr.on('data', function (data) {
        console.log(data.toString());
    });

    prc.on('close', function (code) {
        console.log('process exit code ' + code);
        callback();
    });

    if (tth === null) {
        console.log("Failed to get hash of file");
    }
}

function getReleaseType() {
    // magic number problem here, don't know about users directory structure.
    var releasetype = filePath.split(path.sep)[4]; //get the type of release, from folder structure, ie TV, E:\Media\Tv\tvseries\season\episode

    if (releasetype === 'Tv') {           //format release type for release
        reltype = 'TV';
    }
    else if (releasetype === 'Anime') {
        reltype = 'Anime';
    }
    else if (releasetype === "HD Movies") {
        reltype = 'Movies';
    }
    else {
        reltype = 'Other';
    }
}

function release() {
    console.log("release");
    createMagneticLink();
    getReleaseType();

    console.log(tth);
    console.log(magnetic_link);
    console.log(reltype);

    hub = new nmdc.Nmdc({
        nick: 'Awarua-auto_releasebot',   //nick
        auto_reconnect: false,            // Attempt reconnect if disconnected (60 seconds)
        address: 'ohsnap.ddns.info',      //connection address
        port: 4100,
        //password: 'Helloworld2014',       //Password, if required for nick
        encoding: 'utf8',                 //Hub text encoding
        desc: 'Releasebot',               //Description
        tag: "nmdc.js",                   //tag
        share: 0                         //share size
    }, function() {
        relSearch(disconnect);
    }.bind(this));
}

function disconnect() {
    console.log("Hub parts");
    hub.disconnect();
}

function createMagneticLink() {
    if (tth !== null) {
        magnetic_link = "magnet:?xt=urn:tree:tiger:" + tth + "&xl=" + getFileSize() + "&dn=" + getFileNameForLink();
    }
    else {
        magnetic_link = getFileName();
    }
}

function relSearch(callback) {
    console.log("relSearch");
    console.log(tth);

    setTimeout(function() {
        if (tth !== null) {
            hub.say("!searchReleases " + tth, null);
            console.log("Ask New_Releases with TTH: " + tth);

            hub.onPrivate = function (u, m) {
                if (u === "New_Releases") {
                    console.log("New_Releases said: " + m);

                    if (m.indexOf("No releases found that contain") >= 0) {
                        var message = "!addRelease " + reltype + " " + magnetic_link + " Note please wait for up to 5min";
                        console.log(message);
                        hub.say(message, callback);
                        // release new episode
                        console.log("episode with TTH " + tth + " was released");
                    }
                    else {
                        // release was found already - don't release episode
                        console.log("Not releasing episode with TTH " + tth + " cos someone else already got it");
                        callback();
                    }
                }
            }
        }
        else {
            hub.say("!searchReleases " + magnetic_link, null);
            console.log("Ask New_Releases with TTH: " + magnetic_link);

            hub.onPrivate = function(u, m) {
                if (u === "New_Releases") {
                    console.log("New_Releases said: " + m);

                    if (m.indexOf("No releases found that contain") >= 0) {
                        var message = "!addRelease " + reltype + " " + magnetic_link + ' Search for file, note please wait for up to 5min';
                        console.log(message);
                        hub.say(message, callback);
                        // release new episode
                        console.log("episode with name " + magnetic_link + " was released");
                    }
                    else {
                        // release was found already - don't release episode
                        console.log("Not releasing episode with name " + magnetic_link + " cos someone else already got it");
                        callback();
                    }
                }
            }
        }
    }, 4000);
}

shouldAnnounce();
