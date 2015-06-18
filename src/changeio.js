'use strict';

var debug = require('debug')('changeio');
var _ = require('lodash');
var q = require('q');
var io = require('socket.io');
var TopicPatterns = require('topic-patterns');

function ChangeIO(options){
	var self = this;
	
	options = options || {};
	options.io = options.io || {};
	options.io.path = options.io.path || '/changeio';
	options.namespace = options.namespace || 'any';
	options.namespace = Array.isArray(options.namespace)? options.namespace : [options.namespace];

	options.changeEvent = options.changeEvent || 'change';

	self.options = options;

	self._connections = [];
	self._qualifiers = [];
	self.io = io(self.options.io);

	self.io
	//.of(self.options.namespace)
	.on('connection', function (socket) {
		debug('Connection');
		self._qualify(socket, function(){
			self._connections.push(socket);
		});

		socket.on('disconnect', function(){
			debug('Connection closed', socket.id);
			var index = self._connections.indexOf(socket);
			self._connections.splice(index, 1);
		});
	});
}

ChangeIO.prototype.push = function(qualifier, change, callback){
	var self = this;
	try{
		var report = _.chain(self._connections)
		.map(_.partial(self._push.bind(self), qualifier, change))
		.partition()
		.valueOf();
		debug('Pushed "%s" to %s clients, ommited %s client', qualifier, report[0].length, report[1].length);
		callback();
	}
	catch(err){
		debug('An error occured whilst pushing changes', err.stack);
		callback(err);
	}
};

ChangeIO.prototype._push = function(topic, change, connection){
	var self = this;
	var patterns = connection.compiledChangePatterns || new TopicPatterns(connection.changePatterns || []);

	if(patterns.match(topic)){
		connection.emit(self.options.changeEvent, topic, change);
		return connection.id;
	}
	else{
		return false;
	}
};

ChangeIO.prototype.qualify = function(qualifier){
	var self = this;
	if(typeof qualifier === 'string'){
		self._qualifiers.push(function(c, cb){
			return cb(null, qualifier);
		});
	}
	else if(typeof qualifier === 'function'){
		self._qualifiers.push(qualifier);
	}
	else{
		throw new Error('A change client qualifier should be string pattern or function');
	}
};

ChangeIO.prototype._qualify = function(connection, callback){
	var self = this;

	connection.changePatterns = connection.changePatterns ||[];
	function done(err){
		connection.compiledChangePatterns = new TopicPatterns(connection.changePatterns || []);
		callback(err);
	}

	function runStack(stack, err, qualifier){
		if(err){done(err);}

		if(qualifier){
			connection.changePatterns.push(qualifier);
		}

		if(stack.length === 0){
			return done();
		}
		else{
			return _.head(stack)(connection, _.partial(runStack, _.tail(stack) ));
		}
	}

	runStack(self._qualifiers);
};
ChangeIO.prototype.attach = function(){
	this.io.attach.apply(this.io, arguments);
};

module.exports = ChangeIO;
