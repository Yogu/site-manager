var EventEmitter = require('events').EventEmitter;

function TaskContext() {
	EventEmitter.call(this);
	this.isBusy = false;
	this.currentTask = null;
	this._queue = [];
}

TaskContext.prototype = Object.create(EventEmitter.prototype);

TaskContext.prototype.schedule = function(task) {
	task.context = this;
	this.emit('schedule', task);
	if (this.isBusy) {
		this._queue.push(task);
	} else {
		this.isBusy = true;
		this.emit('status');
		this._runTask(task);
	}
};

TaskContext.prototype._runNextTask = function() {
	if (this._queue.length == 0) {
		this.currentTask = null;
		this.isBusy = false;
		this.emit('status');
	} else {
		var task = this._queue.shift();
		this._runTask(task);
	}
};

TaskContext.prototype._runTask = function(task) {
	this.currentTask = task;
	this.emit('run', task);
	task.start();
	task.then(function(result) {
		this.emit('done', task, result);
		this._runNextTask();
	}.bind(this), function(error) {
		this.emit('fail', task, error);
		this._runNextTask();
	}.bind(this));
};

module.exports = TaskContext;
