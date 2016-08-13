let nmdc = require('nmdc'),
    chrono = require('chrono-node'),
    config = require('./config.json'),
    fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    release = {},
    hub;


const day = 24 * 60 * 60 * 1000,
    now = new Date().getTime();

function getTTH(cb) {
    let prc = spawn('java', ['-jar', path.resolve(__dirname, 'lib/tth/tth.jar'), release.filePath]);

    prc.stdout.on('data', function (data) {
        data = data.toString();
        let line = data.replace(/(\r?\n)/g, '');
        line = line.match(/^TTH:\s+.*$/);
        if (line) {
            release.tth = line[0].replace(/^TTH:\s/, '');
        }
        else {
            console.info('Could not find TTH: prefix in process output, possibly not the right line?');
        }
    });

    prc.stderr.on('data', function(data) {
        console.error('TTH process failed with error: ' + data.toString());
    });

    prc.on('close', function(code) {
        console.info('process exited with code: ', + code);
        if (cb) {
            cb();
        }
    });
}

function searchReleases(callback) {
    setTimeout(() => {
        if (release.tth) {
            hub.onPrivate = (user, message) => {
                if (user === 'New_Releases') {
                    console.log('New_Releases said: ' + message);
                    if (message.indexOf('*WARNING*') >= 0) {
                        //throw away warning message.
                        return;
                    }
                    if (message.indexOf('No releases found that contain') >= 0) {
                        let response = '!addRelease ' + release.type + ' ' + release.magneticLink + '\nNote please wait for file to be hashed';
                        if (release.silent) {
                            response += " --silent";
                        }
                        console.log('Announcing release: ' + response);
                        hub.say(response, callback);
                    }
                    else {
                        console.log('Release matching tth already present');
                        callback();
                    }
                }
            };

            hub.say('!searchReleases ' + release.tth, null);
            console.log('Ask new releases if a release exists matching TTH: ' + release.tth);
        }
        else {
            hub.onPrivate = (user, message) => {
                if (user === 'New_Releases') {
                    console.log('New_Releases said: ' + message);
                    if (message.indexOf('*WARNING*') >= 0) {
                        //throw away warning message.
                        return;
                    }
                    if (message.indexOf('No releases found that contain') >= 0) {
                        let response = '!addRelease ' + release.type + ' ' + release.magneticLink + '\nSearch for file, note please wait for file to be hashed';
                        if (release.silent) {
                            response += " --silent";
                        }
                        console.log('Announcing release: ' + response);
                        hub.say(response, callback);
                    }
                    else {
                        console.log('Release matching name ' + release.name + ' already present');
                        callback();
                    }
                }
            };

            hub.say('!searchReleases ' + release.name, null);
            console.log('Ask new releases if a release exists matching : ' + release.name);
        }
    }, 4000);
}

function prepareRelease() {
    if (!release.tth) {
        console.error('TTH for file not generated');
        release.magneticLink = release.name;
    }
    else {
        release.magneticLink = 'magnet:?xt=urn:tree:tiger:' + release.tth + '&xl=' + release.fileSize + '&dn=' + release.name;
    }

    for (let rlsType of config.types) {
        if (release.filePath.includes(rlsType.path)) {
            release.type = rlsType.type;
            break;
        }
    }

    if (!release.type) {
        release.type = "Other";
    }

    hub = new nmdc.Nmdc({
        nick: config.nick || 'RelelaseBot',
        password: config.password || '',
        address: config.address,
        port: config.port,
        auto_reconnect: false,
        encoding: 'utf8',
        desc: 'Announces releases to hub server',
        tag: 'bot',
        share: 0
    }, () => {
        searchReleases(() => {
            console.log('Disconnected from hub');
            hub.disconnect();
        });
    });
}

(function announce() {
    let path,
        airDate;

    if (!config || !config.address || !config.port) {
        console.error('No config :(');
        return;
    }

    if (process.env.sonarr_episodefile_path) {
        console.info("Detected Sonarr environment variables");
        path = process.env.sonarr_episodefile_path;
        if (process.env.sonarr_episodefile_episodeairdatesutc) {
            airDate = chrono.parseDate(process.env.sonarr_episodefile_episodeairdatesutc).toISOString();
        }
        else if (process.env.sonarr_episodefile_episodeairdates) {
            airDate = chrono.parseDate(process.env.sonarr_episodefile_episodeairdates).toISOString();
        }
    }
    else {
        path = process.argv[2];
        airDate = process.argv[3];
    }

    if (path == null || airDate == null || isNaN(airDate)) {
        console.error('problem with script arguments, path: ' + path + ' airDate: ' + airDate);
        return;
    }

    release.filePath = path.normalize(path);
    release.fileSize = parseInt(fs.statSync(release.filePath).size);
    release.airDate = Date.parse(airDate);
    release.name = encodeURIComponent(path.basename(release.filePath));
    release.name = release.name.replace(/%20/g, '+');

    let daysElapsed = config.daysElapsed || 16;
    if (now < release.airDate + (day * daysElapsed)) {
        console.log('Release is within elapsed days, realeasing');

    }
    else {
        console.log('Air data of release is older that elapsed days, don\'t announce');
	return;
    }

    release.silent = false;

    if (config.silent) {
        release.silent = config.silent;
    }

    getTTH(prepareRelease);

})();
