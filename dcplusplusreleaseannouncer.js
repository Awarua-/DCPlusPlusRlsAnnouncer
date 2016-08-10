let nmdc = require('nmdc'),
    config = require('./config.json'),
    fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    release = {},
    hub;


const day = 24 * 60 * 60 * 1000,
    now = new Date().getTime();

function log(message) {
	//fs.appendFileSync('log.txt', message);
};

function getTTH(cb) {
    let prc = spawn('java', ['-jar', path.resolve(__dirname, 'lib/tth/tth.jar'), release.filePath]);

    prc.stdout.setEncoding('utf8');
    prc.stdout.on('data', function (data) {
        data = data.toString();
        let line = data.replace(/(\r?\n)/g, '');
        line = line.match(/^TTH:\s+.*$/);
        if (line) {
            release.tth = line[0].replace(/^TTH:\s/, '');
        }
        else {
            console.info('Could not find TTH: prefix in process output');
            return;
        }
    });

    prc.stderr.setEncoding('utf8');
    prc.stderr.on('data', function(data) {
        console.error('TTH process failed with error: ' + data.toString());
    });

    prc.on('close', function(code) {
        console.error('process exited with code: ', + code);
        if (cb) {
            cb();
        }
    });
};

function searchReleases(callback) {
    hub.onSystem = (message) => {
	console.error(message);
    };

    hub.onDebug = (message) => {
	console.error(message);
    };

    setTimeout(() => {
        if (release.tth) {
            hub.onPrivate = (user, message) => {
                if (user === 'New_Releases') {
                    console.error('New_Releases said: ' + message);
			log('New_Releases said: ' + message);

                    if (message.indexOf('No releases found that contain') >= 0) {
                        let response = '!addRelease ' + release.type + ' ' + release.magneticLink + '\nNote please wait for file to be hashed';
                        console.error('Announcing release: ' + response);
			log('Announcing release: ' + response);
                        hub.say(response, callback);
                    }
                    else {
                        console.error('Release matching tth already present');
			log('Release matching tth already present');
                        callback();
                    }
                }
            };

            hub.say('!searchReleases ' + release.tth, null);
            console.error('Ask new releases if a release exists matching TTH: ' + release.tth);
        }
        else {
            hub.onPrivate = (user, message) => {
                if (user === 'New_Releases') {
                    console.error('New_Releases said: ' + message);
			log('New_Releases said: ' + message);
                    if (message.indexOf('No releases found that contain') >= 0) {
                        let response = '!addRelease ' + release.type + ' ' + release.magneticLink + '\nSearch for file, note please wait for file to be hashed';
                        console.error('Announcing release: ' + response);
			log('Announcing release: ' +  response);
                        hub.say(response, callback);
                    }
                    else {
                        console.error('Release matching name ' + release.name + ' already present');
                        callback();
                    }
		}
            };

            hub.say('!searchReleases ' + release.name, null);
            console.error('Ask new releases if a release exists matching : ' + release.name);
        }
    }, 4000);
};

function prepareRelease() {
    if (!release.tth) {
        console.error('TTH for file not generated, failed to release');
        release.magneticLink = 'magnet:?xl=' + release.fileSize + '&dn=' + release.name;
    }
    else {
        release.magneticLink = 'magnet:?xt=urn:tree:tiger:' + release.tth + '&xl=' + release.fileSize + '&dn=' + release.name;
    }

    for (let rlsType in config.types) {
	console.error(rlsType);
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
            console.error('Disconnected from hub');
            hub.disconnect();
        });
    });
};

(function announce() {
    if (!config || !config.address || !config.port) {
        console.error('No config :(');
        return;
    }
    console.log(process.argv[2]);
    release.filePath = path.normalize(process.argv[2]);
    release.fileSize = parseInt(fs.statSync(release.filePath).size);
    release.airDate = Date.parse(process.argv[3]);
    release.name = encodeURIComponent(path.basename(release.filePath));
    release.name = release.name.replace(/%20/g, '+');


    let daysElapsed = config.daysElapsed || 16;
    console.error('inputdate: ' + process.argv[3]);
    console.error(release.airDate);
    console.error(now);
    console.error(release.airDate + (day * daysElapsed));
    if (now < release.airDate + (day * daysElapsed)) {
        console.error('Release is within elapsed days, realeasing');

    }
    else {
        console.error('Air data of release is older that elapsed days, don\'t announce');
	return;
    }

    getTTH(prepareRelease);

})();
