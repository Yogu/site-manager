var Promise = require('es6-promise').Promise;
var EventEmitter = require('events').EventEmitter;

function Task(name, perform) {
	// capture the callbacks to defer the actual task performance until start() is called
	Promise.call(this, function(resolve, reject) {
		this._resolve = function() {
			this.status = 'done';
			resolve.apply(this, arguments);
		}.bind(this); 
		
		this._reject = function() {
			this.status = 'failed';
			reject.apply(this, arguments);
		}.bind(this);
	}.bind(this));
	
	this.status = 'ready';
	this._events = new EventEmitter();
	this.id = Task._nextTaskID++;
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
	
	try {
		this.perform(this._resolve, this._reject);
	} catch (e) {
		this._reject(e);
	}
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

Task.prototype.log = function(message) {
	this._events.emit('log', message);
};

Task.prototype.runNested = function(task) {
	task.on('log', function(message) {
		this.log('  ' + message);
	}.bind(this));
	this.log('Starting nested task ' + task.name);
	task.start();
	return task.then(function(result) {
		this.log('Nested task ' + task.name + ' succeeded');
		return result;
	}.bind(this), function(e) {
		this.log('Nested task ' + task.name + ' failed' + (e ? ': ' + e : ''));
		throw e;
	}.bind(this));
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
