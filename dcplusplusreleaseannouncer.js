let nmdc = require('nmdc'),
    config = require('config.json'),
    fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    release = {},
    hub;


const day = 24 * 60 * 60 * 1000,
    now = new Date().getTime();

function getTTH(cb) {
    let prc = spawn('java', ['-jar', path.resolve(__dirname, '../../lib/tth/tth.jar'), release.filePath]);

    prc.stdout.setEncoding('utf8');
    prc.stdout.on('data', function (data) {
        data = data.toString();
        let line = str.replace(/(\r?\n)/g, '');
        line = line.match(/^TTH:\s+.*$/);
        if (line) {
            release.tth = line[0].replace(/^TTH:\s/, '');
        }
        else {
            console.error('Could not find TTH: prefix in process output');
            return;
        }

        prc.stderr.setEncoding('utf8');
        prc.stderr.on('data', function(data) {
            console.error('TTH process failed with error: ' + data.toString());
        })

        prc.on('close', function(code)) {
            console.info('process exited with code: ', + code);
            if (cb) {
                cb();
            }
        }
    })
};

function searchReleases() {
    setTimeout(() => {
        if (release.tth) {
            hub.onPrivate = (user, message) => {
                if (u === 'New_Releases') {
                    console.info('New_Releases said: ' + message);

                    if (m.indexOf('No releases found that contain') >= 0) {
                        let response = '!addRelease ' + release.type + ' ' + release.magneticLink + '\nNote please wait for file to be hashed';
                        console.info('Announcing release');
                        hub.say(response, callback);
                    }
                    else {
                        console.info('Release matching tth already present');
                        callback();
                    }
                }
            }

            hub.say('!searchReleases ' + release.tth, null);
            console.info('Ask new releases if a release exists matching TTH: ' + release.tth);
        }
        else {
            hub.onPrivate = (user, message) => {
                if (u === 'New_Releases') {
                    console.info('New_Releases said: ' + message);
                    if (message.indexOf('No releases found that contain') >= 0) {
                        let response = '!addRelease ' + release.type + ' ' + release.magneticLink + '\nSearch for file, note please wait for file to be hashed';
                        console.info('Announcing release');
                        hub.say(response, callback);
                    }
                }
                else {
                    console.info('Release matching name ' + release.magneticLink + ' already present');
                    callback();
                }
            }

            hub.say('!searchReleases ' + release.magneticLink, null);
            console.info('Ask new releases if a release exists matching : ' + release.magneticLink);
        }
    }, 4000);
};

function release() {
    if (!release.tth) {
        console.error('TTH for file not generated, failed to release');
        release.magneticLink = path.basename(filePath);
    }
    else {
        release.magneticLink = 'magnet:?xt=urn:tree:tiger:' + release.tth + '&xl=' + release.fileSize + '&dn=' + encodeURIComponent(release.filePath);
    }

    for (let rlsType in config.types) {
        if (release.path.indexOf(path.resolve(rlsType.path)) == 0) {
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
            console.info('Disconnected from hub');
            hub.disconnect()
        });
    })
};

(function announce() {
    if (!config || !config.address || !config.port) {
        console.error('No config :(');
        return;
    }
    release.filePath = path.resolve(process.argv[2]);
    release.fileSize = parseInt(fs.statSync(release.filePath)['size']);
    release.airDate = Date.parse(process.argv[3]);

    getTTH(release);

    let daysElapsed = config.daysElapsed || 16;

    if (now < release.airDate + day * daysElapsed) {
        console.info('Release is within elapsed days, realeasing');

    }
    else {
        console.info('Air data of release is older that elapsed days, don\'t announce');
    }


})();
