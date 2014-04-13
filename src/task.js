var Promise = require('es6-promise').Promise;
var EventEmitter = require('events').EventEmitter;
var moment = require('moment');
var Q = require('q');

var uniqueTaskSuffix = 0;

function Task(name, perform) {
	// capture the callbacks to defer the actual task performance until start() is called
	Promise.call(this, function(resolve, reject) {
		this._resolve = function(result) {
			this.status = 'done';
			this._events.emit('status');
			resolve(result);
		}.bind(this); 
		
		this._reject = function(err) {
			if (err)
				this.doLog('failed: ' + err);
			this.status = 'failed';
			this._events.emit('status');
			reject(err);
		}.bind(this);
	}.bind(this));
	
	this.status = 'ready';
	this._events = new EventEmitter();
	this.id = moment().format('YYYY-MM-DD--HH-mm-ss.SSS') + ('000' + uniqueTaskSuffix++).slice(-3);
	this.log = '';
	
	// single callback argument?
	if (name instanceof Function) {
		perform = name;
		name = undefined;
	}
	
	if (name)
		this.name = name;
	else
		this.name = 'Task #' + this.id;
	if (perform)
		this.perform = perform;
};

Task._nextTaskID = 1;

Task.prototype = Object.create(Promise.prototype);

Task.prototype.start = function() {
	if (this.status != 'ready')
		throw new Error("This task has already been started (status is " + this.status + ")");
	if (!(this.perform instanceof Function))
		throw new Error("Tasks must have a perform() method");
	
	this.status = 'running';
	this._events.emit('status');
	
	try {
		this._doPerform();
	} catch (e) {
		this._reject(e);
	}
};

Task.prototype._doPerform = function() {
	// support generators
	function* sampleGenerator(){}
	if (this.perform.constructor == sampleGenerator.constructor) {
		Q.async(this.perform.bind(this))().then(this._resolve, this._reject);
		return;
	}
	
	var result = this.perform(this._resolve, this._reject);
	
	// support returned promises
	if ((typeof result) == 'object' && (typeof result.then) == 'function')
		result.then(this._resolve, this._reject);
};

Task.prototype.perform = function(resolve, reject) {
	reject("perform() method must be overridden");
};

Task.prototype.on = function() {
	this._events.on.apply(this._events, arguments);
};

Task.prototype.once = function() {
	this._events.once.apply(this._events, arguments);
};

Task.prototype.doLog = function(message) {
	message.split('\n').forEach(function(line) {
		if (line == '')
			return;
		this.log += line + "\n";
		this._events.emit('log', line);
	}.bind(this));
};

Task.prototype.runNested = function(task) {
	task.on('log', function(message) {
		this.doLog('  ' + message);
	}.bind(this));
	this.doLog('run: ' + task.name);
	task.start();
	return task;
};

Task.prototype.cd = function(path) {
	this.cwd = path;
};

Task.prototype.exec = function(shellCommand, cwd) {
	var ShellTask = require('./tasks/shell.js');
	var task = new ShellTask(shellCommand, cwd || this.cwd);
	return this.runNested(task);
};

module.exports = Task;
