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
    tth,
    magnetic_link,
    reltype,
    hub;

fs = require("fs");
path = require("path");
nmdc = require("../../lib/nmdc/nmdc");
filePath = process.argv[2];
airDate = process.argv[7];

hub = new nmdc.Nmdc({
  nick: 'Awarua-auto_releasebot',   //nick
  auto_reconnect: false,            // Attempt reconnect if disconnected (60 seconds)
  address: '192.168.2.101',      //connection address
  //password: 'Helloworld2014',       //Password, if required for nick
  encoding: 'utf8',                 //Hub text encoding
  desc: 'Releasebot',               //Description
  tag: "nmdc.js",                   //tag
  share: 0                         //share size
});

function shouldAnnounce() {
    var now = new Date().getTime(),
        airDateInMs = Date.parse(airDate),
        daysInMs = daysSinceRelease * 24 * 60 * 60 * 1000;

    if (now < airDateInMs + daysInMs) {
        console.log("good to release");
        getFileName(); //this doesn't feel right
        getFileSize();
        getTTH(release);
    }
}

function getFileName() {
    fileName = path.basename(filePath);
    fileName = fileName.replace(/ /g, '+');
    fileName = fileName.replace(/,/g, '%2C');

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

    if (tth === null) {
        console.log("Failed to get hash of file");
    }
}

function getReleaseType() {
    var releasetype = filePath.split("\\")[2]; //get the type of release, from folder structure, ie TV, E:\Media\Tv\tvseries\season\episode
    if (releasetype == 'Tv') {           //format release type for release
        reltype = 'tvseries';
    }
    else if (releasetype == 'Anime') {
        reltype = 'anime';
    }
    else if (releasetype == "HD Movies") {
        reltype = 'movie';
    }
    else {
        reltype = 'other';
    }
}

function release() {
    createMagneticLink();
    getReleaseType();

    hub.onConnect = function() {
        relSearch();
    };
    setTimeout(function() {
        console.log('hub parts'); hub.disconnect();
    }, 10000);
}

function createMagneticLink() {
    if (tth !== null) {
        magnetic_link = "magnet:?xt=urn:tree:tiger:" + tth + "&xl=" + parseInt(fileSizeInBytes) + "&dn=" + fileName;
    }
    else {
        console.log("release as unlinked");
        magnetic_link = fileName;
    }
}

function relSearch() {
    if (tth !== null) {
        hub.pm("New_Releases", "!searchrel " + tth, null);
        console.log("pmd New_Releases with TTH: " + tth);

        hub.onPrivate = function(u, m) {
            if (u === "New_Releases") {
                console.log("New_Releases said: " + m);

                if (m.indexOf("was not found in releases") >= 0) {
                    var message = "!addrel " + reltype + " " + magnetic_link + " Note please wait for up to 5min";
                    console.log(message);
                    hub.say(message, null);
                    // release new episode
                    console.log("episode with TTH " + tth + " was released");
                }
                else {
                    // release was found already - don't release episode
                    console.log("Not releasing episode with TTH " + tth + " cos someone else already got it");
                }
            }
        }
    }
    else {
        console.log("Release as unlinked");
        hub.say('!addrel ' + reltype + ' ' + magnetic_link + ' Search for file, note please wait for up to 5min', null);
    }

}

shouldAnnounce();