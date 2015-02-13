# nmdc.js

This package provides an object allowing you to chat on an NMDC hub server, such
as PtokaX. 

## Sample code

    var hub = new require("nmdc").Nmdc({
        address: "127.0.0.1",
        auto_reconnect: true
    });

    hub.onConnect = function() {
        hub.say('Hi everyone!');
    };

    hub.onPublic = function(user, message) {
        if (user != hub.opts.nick) {
            hub.say(user + ' just said ' + message);
        }
    };

## API reference

    var opts = {
        address:        '127.0.0.1',      // Connection address
        port:           411,              // Connection port
        password:       '',               // Password, if required for nick
        auto_reconnect: false,            // Attempt reconnect if disconnected (60 seconds)
        encoding:       'utf8',           // Hub text encoding
        nick:           'nmdc.js_user',   // Your nick
        desc:           '',               // Your description
        tag:            "nmdc.js 1.1",    // Your tag
        share:          0,                // Your share size
    };

Supply replacements to the above default options by passing a key-value map in
the same format, as the first argument to the Nmdc constructor:

    var hub = new Nmdc([options, [onConnect]]);

Constructor.

    hub.onConnect    = function();                   // Connected and ready to chat
    hub.onSystem     = function(message);
    hub.onPublic     = function(username, message);  // Message appeared in main chat
    hub.onPrivate    = function(username, message);  // Recieved a private message
    hub.onUserJoin   = function(username);
    hub.onUserPart   = function(username);
    hub.onUserUpdate = function(username);           // Updated MyINFO for user
    hub.onDebug      = function(message);
    hub.onClosed     = function();
    hub.onUserCommand= function(type, context, title, raw);

Replace any of the above functions in your object to handle events.

    hub.hubName;  // The currently connected hub's name
    hub.opts;     // The options used to connect with
    hub.users = { // A list of all connected hub users.
        'user_nick': {
            'nick' : 'user_nick',
            'desc' : '',
            'tag'  : '',
            'share': '0',
        }
    }

