/* _  ___  _| _    * _
  | )[ | )(_](_ *  |_)       Copyright (c) 2012-2014 -- the nmdc.js author
                 ._|   
Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted, provided that the above
  copyright notice and this permission notice appear in all copies.
*/

"use strict";
var net = require('net');

var NMDC_JS_RECONNECT_TIMEOUT = 30*1000;
var NMDC_JS_KEEPALIVE_TIMEOUT = 15*1000;

/**
 * Constructor for new Nmdc class instances.
 *
 * @class Nmdc
 * @constructor
 */
function Nmdc(options, onConnect) {

	// Simulate calling constructor with 'new' if it was omitted
	if (!(this instanceof Nmdc)) {
		return new Nmdc(options, onConnect);
	}

	// Handlers
	this.onConnect    = onConnect || function(){};
	this.onSystem     = function(s){};
	this.onPublic     = function(u,m){};
	this.onPrivate    = function(u,m){};
	this.onUserJoin   = function(u){};
	this.onUserPart   = function(u){};
	this.onUserUpdate = function(u){};
	this.onDebug      = function(s){};
	this.onClosed     = function(){};	
	this.onUserCommand= function(type, context, title, raw){};
	
	this.opts = {
		address: '127.0.0.1',
		port: 411,
		password: '',
		auto_reconnect: false,
		encoding: 'utf8',		
		nick: 'nmdcjs_user',
		desc: '',
		tag: "nmdc.js 1.3",
		share: 0
	};
	
	if (typeof(options) !== 'undefined') {
		for (var i in options) {
			this.opts[i] = options[i];
		}
	}
	
	this.users = {};
	this.hubName = '';
	
	this.nmdc_connected = false;	
	this.nmdc_partial = '';
	
	this._reconnector = false;
	
	this.sock = null;
	
	return this.reconnect();
}

Nmdc.prototype.USERCOMMAND_TYPE_SEPARATOR = 0;
Nmdc.prototype.USERCOMMAND_TYPE_RAW = 1;
Nmdc.prototype.USERCOMMAND_TYPE_NICKLIMITED = 2;
Nmdc.prototype.USERCOMMAND_TYPE_CLEARALL = 255;

Nmdc.prototype.USERCOMMAND_CONTEXT_HUB = 1;
Nmdc.prototype.USERCOMMAND_CONTEXT_USER = 2;
Nmdc.prototype.USERCOMMAND_CONTEXT_SEARCH = 4;
Nmdc.prototype.USERCOMMAND_CONTEXT_FILELIST = 8;

// #################
// Methods
// #################

/**
 * Send a raw protocol message over the TCP socket. The message is not escaped
 *  and does not add a trailing pipe.
 *
 * @param {String} raw Raw data to send
 * @param {Function} cb Callback on completion
 * @return {Nmdc} Returns self for chained calls 
 */
Nmdc.prototype.raw = function(raw, cb) {
	this.sock.write(raw, this.opts.encoding, cb);
	return this;
};

/**
 * Post a message to main chat.
 *
 * @param {String} message Message to send
 * @param {Function} cb Callback on completion
 * @return {Nmdc} Returns self for chained calls
 */
Nmdc.prototype.say = function(message, cb) {
	return this.raw('<'+this.opts.nick+'> '+nmdc_escape(message)+'|', cb);
};

/**
 * Send a private message to a user.
 *
 * @param {String} user User nick to send message to
 * @param {String} message Message to send
 * @param {Function} cb Callback on completion
 * @return {Nmdc} Returns self for chained calls
 */
Nmdc.prototype.pm = function(user, message, cb) {
	return this.raw(
		'$To: '+user+' From: '+this.opts.nick+' $<'+this.opts.nick+'> '+
		nmdc_escape(message)+'|',
		cb
	);
};

/**
 * Disconnect from the hub. Note that if you set nmdc.opts.auto_reconnect, then
 *  the hub might auto-reconnect (unless you also call setAutoReconnect(false)).
 *
 * @return {Nmdc} Returns self for chained calls
 */
Nmdc.prototype.disconnect = function() {
	if (this.sock !== null) {
		this.sock.destroy();
		this.sock = null;
	}
	
	if (this.nmdc_connected) {
		this.onClosed(); // normal disconnection event
	} else {
		if (this.sock !== null) {
			this.onDebug('Aborting incomplete connection');
		}
	}
	
	this.nmdc_connected = false;

	return this;
};

/**
 * Configure whether the object automatically reconnects to the hub on failure.
 *
 * @param {Boolean} enable Whether to enable autoreconnect behaviour
 * @return {Nmdc} Returns self for chained calls
 */
Nmdc.prototype.setAutoReconnect = function(enable) {

	var self = this;
	this.opts.auto_reconnect = !!enable;

	if (enable && this._reconnector === false) {
		this._reconnector = setInterval(
			function() {
				if (! self.nmdc_connected) {
					self.onDebug('Reconnecting...');
					self.reconnect();
				}
			},
			NMDC_JS_RECONNECT_TIMEOUT
		);
	
	} else if (!enable && this._reconnector !== false) {
		clearInterval(this._reconnector);
		this._reconnector = false;
		
	}
	
	return this;
};

/**
 * Connect to the hub as configured by self.opts.
 *
 * @return {Nmdc} Returns self for chained calls
 */
Nmdc.prototype.reconnect = function() {
	var self = this;
	
	if (this.sock !== null) {
		this.disconnect();
	}
	
	this.sock = null;	
	this.sock = net.createConnection(this.opts.port, this.opts.address);
	this.sock.setEncoding(this.opts.encoding);
	this.sock.setKeepAlive(true, NMDC_JS_KEEPALIVE_TIMEOUT);
	
	this.sock.on('connect', function() {
		self.onSystem('Connected to server.');
	});
	
	// Network errors
	
	this.sock.on('end', function() {
		self.onSystem('Connection closed.');
		self.disconnect();
	});
	
	this.sock.on('error', function(e) {
		self.onSystem('Connection error ('+e.code+')');
		self.disconnect();
	});
	
	this.sock.on('timeout', function() {
		self.onSystem('Connection timed out.');
		self.disconnect();
	});
	
	// Data
	
	this.sock.on('data', function(data) {
		var commands = data.split('|');
		
		// Handle protocol buffering
		commands[0] = self.nmdc_partial + commands[0];
		self.nmdc_partial = commands[commands.length - 1];		
		for (var i = 0; i < commands.length - 1; i++) {
			self.nmdc_handle(commands[i]);
		}
			
	});
	
	// Handle auto reconnect
	this.setAutoReconnect(!! this.opts.auto_reconnect);
	
	return this;
};

// #################
// Internal
// #################

Nmdc.prototype.nmdc_handle = function(data) {
	
	// Short-circuit public chat
	if (data[0] === '<') {
		var rpos = data.indexOf('> ');
		this.onPublic(
			data.substr(1, rpos-1),
			nmdc_unescape(data.substr(rpos+2))
		);
		return this;
	}
	
	if (data[0] === '*') {
		this.onSystem(data);
		return this;
	}
	
	// Short-circuit system messages
	if (data[0] !== '$') {
		this.onDebug('Unhandled message: '+data);
		return this;
	}
	
	var cmd = data.split(' ')[0];
	var rem = data.substr(cmd.length + 1);	
	switch (cmd) {
		
		case '$Lock': {
			var key = nmdc_locktokey(rem);
			this.sock.write(
				'$Supports NoGetINFO UserCommand UserIP2|'+
				'$Key '+key+'|'+
				'$ValidateNick '+this.opts.nick+'|'
			);
		} break;
		
		case '$Hello': {
			if (rem === this.opts.nick) {
				
				// Handshake
				this.sock.write('$Version 1,0091|');
				this.sock.write('$GetNickList|');
				this.sock.write('$MyINFO '+nmdc_getmyinfo(this.opts)+'|');
				
			} else {
				if (!(rem in this.users)) {
					this.users[rem] = '';
					this.onUserJoin(rem);
				}
			}
		} break;
		
		case '$HubName': {
			this.hubName = rem;
		} break;
		
		case '$ValidateDenide': {
			if (this.opts.password.length) {
				this.onSystem('Password incorrect.');
			} else {
				this.onSystem('Nick already in use.');
			}
		} break;
		
		case '$HubIsFull': {
			this.onSystem('Hub is full.');
		} break;
		
		case '$BadPass': {
			this.onSystem('Password incorrect.');
		} break;
		
		case '$GetPass': {
			this.sock.write('$MyPass '+this.opts.password+'|');
		} break;
		
		case '$Quit': {
			delete this.users[rem];
			this.onUserPart(rem);
		} break;
		
		case '$MyINFO': {
			var user = nmdc_parsemyinfo(rem);
			var nick = user.nick;
			if (!(nick in this.users)) {
				this.users[nick] = '';
				this.onUserJoin(nick);
			}
			this.users[nick] = user;
			this.onUserUpdate(rem);
		} break;
		
		case '$NickList': {
			var users = rem.split('$$');
			for (var i in users) {
				var user = users[i];
				if (! user.length) continue;
				if (!(user in this.users)) {
					this.users[user] = '';
					this.onUserJoin(user);
				}
			}
		} break;
		
		case '$To:': {
			var pto = nmdc_parseto(rem);
			this.onPrivate(pto[0], nmdc_unescape(pto[1]));
		} break;
		
		case '$UserIP': {
			// Final message in PtokaX connection handshake - trigger connection
			//  callback. This might not always be the case for other hubsofts?
					
			if (! this.nmdc_connected) {
				this.onConnect(); // Only call once per connection
			}
			this.nmdc_connected = true;			
		} break;
		
		case '$UserCommand': {
			var parts = rem.match(/(\d+) (\d+)\s?([^\$]*)\$?(.*)/);
			if (parts.length === 5) {
				this.onUserCommand(+parts[1], +parts[2], parts[3], nmdc_unescape(parts[4]));
			}
		} break;
		
		// Ignorable:
		case '$Supports':
		case '$UserList':
		case '$OpList':
		case '$HubTopic':
		{ break; }
		
		default: {
			this.onDebug('NMDC: Unhandled "'+cmd+'"');
		} break;
	}
	
	return this;
};

// #################
// Exports
// #################

exports.Nmdc = Nmdc; // Export constructor

// #################
// Helpers
// #################


var nmdc_getmyinfo = function(o) {
	return "$ALL "+o.nick+" "+(o.desc.length ? (o.desc+" "):"")+
		"<"+o.tag+",M:P,H:1/0/0,S:5>$ $10  $$"+o.share+"$|";
};

var nmdc_locktokey = function(lock) {
	// Coded by Mardeg
	var nibbleswap = function(bits) {
		return ((bits << 4) & 240) | ((bits >>> 4) & 15);
	};
	var chr = function(b) {
		return (("..0.5.36.96.124.126.").indexOf("."+b+".") > 0) ? 
			"/%DCN"+(0).toPrecision(4-b.toString().length).substr(2)+b+"%/" : 
			String.fromCharCode(b)
		;
	};
	
	var key = chr(nibbleswap(
		lock.charCodeAt(0) ^ lock.charCodeAt(-1) ^ lock.charCodeAt(-2) ^ 5
	));
	for (var i=1; i<lock.length; i++) {
		key += chr(nibbleswap(lock.charCodeAt(i) ^ lock.charCodeAt(i - 1)));
	}
	return key;
};

var nmdc_escape = function(str) {
	return (''+str).length ? (''+str).
		replace(/&/g,'&amp;').replace(/\|/g,'&#124;').replace(/\$/g,'&#36;') :
		' ';
};

var nmdc_unescape = function(str) {
	return (''+str).replace(/&#36;/g,'$').
		replace(/&#124;/g,'|').replace(/&amp;/g,'&');
};

var nmdc_parsemyinfo = function(str) {
	// $ALL <nick> <description>$ $<connection><flag>$<e-mail>$<sharesize>$
	var ds = str.indexOf(' ', 6);
	var ret = {
		'nick' : str.substr(5, ds-5),
		'desc' : str.substr(ds+1, str.indexOf('$', 2)-ds),
		'tag'  : '',
		'share': str.substr(str.lastIndexOf('$', str.length-2)).slice(1, -1)
	};
	var tpos = ret.desc.indexOf('<');
	if (tpos !== -1) {
		ret.tag  = ret.desc.substr(tpos+1).slice(0,-2);
		ret.desc = ret.desc.substr(0, tpos-1);
	}
	return ret;
};

var nmdc_parseto = function(str) {
	// recipient From: sender $<sender> message|
	var lpos = str.indexOf('$<');
	var rpos = str.indexOf('> ');
	return [ str.slice(lpos+2, rpos), str.slice(rpos+2) ];
};
