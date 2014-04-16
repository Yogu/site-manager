var TaskContext = require('./taskContext.js');
var yaml = require('js-yaml');
var objects = require('./objects.js');
var fs = require('q-io/fs');
var mkdirp = require('mkdirp');
var moment = require('moment');
var Q = require('q');
var strings = require('./strings');
require('colors');

/**
 * A task context that archives logs of succeeded and failed tasks
 * @param path the path to store the logs in
 */
function PersistentTaskContext(path) {
	TaskContext.call(this);
	this._taskArchivePathSet = Q.Promise(function(resolve) { 
		this._resolveTaskArchivePathSet = resolve;
	}.bind(this));
	if (path)
		this.setTaskArchivePath(path);
	this._tasksInMemory = [];
	
	this.on('schedule', function(task) {
		task.scheduleTime = new Date();
		this._tasksInMemory.unshift(task);
	}.bind(this));
	
	this.on('run', function(task) {
		task.startTime = new Date();
	});
	
	this.on('done', function(task) {
		task.doLog('Done.'.green.bold);
		this._archiveTask(task).done(); 
	}.bind(this));
	this.on('fail', function(task) { this._archiveTask(task).done(); }.bind(this));
}

PersistentTaskContext.prototype = Object.create(TaskContext.prototype);

PersistentTaskContext.prototype.setTaskArchivePath = function(path) {
	this._taskArchivePathInitialized = Q.async(function*() {
		yield Q.nfcall(mkdirp, path);
		this._taskArchivePath = path;
		this._resolveTaskArchivePathSet();
	}.bind(this))();
	this._taskArchivePathInitialized.done(); // throw on error
};

PersistentTaskContext.prototype._archiveTask = Q.async(function*(task) {
	task.endTime = new Date();
	task.duration = moment(task.endTime).diff(task.startTime);
	
	// wait until we have a place to archive
	yield this._taskArchivePathSet;
	
	yield this._saveTask(task);
	
	// remove the task from memory once it is saved on disk
	this._tasksInMemory = this._tasksInMemory.filter(function(t) { return t != task; });
});

PersistentTaskContext.prototype._saveTask = Q.async(function*(task) {
	var path = this._taskArchivePath + '/' + task.id + '.yaml';
	var serialized = yaml.safeDump(objects.extract(task, '*'));
		
	yield fs.write(path, serialized);
});

PersistentTaskContext.prototype.getTasks = Q.async(function*(offset, count) {
	var tasks = [];
	if (offset < this._tasksInMemory.length) {
		tasks = this._tasksInMemory.slice(offset, offset + count);
		count -= tasks.length;
	}
	
	// if we have enough tasks or there is no archive path set yet, we're done
	if (count <= 0 || !this._taskArchivePathInitialized)
		return tasks;
	
	yield this._taskArchivePathInitialized;
	
	var files = yield fs.list(this._taskArchivePath);
	
	files.reverse(); // newest first
	var end = Math.min(files.length, offset + count);
	for (var i = offset; i < end; i++) {
		var fileName = files[i];
		if (fileName.substr(-5) != '.yaml')
			break;
		var id = fileName.substr(0, fileName.length - 5);
		if (tasks.some(function(t) { return t.id == id;}))
			break; // task is already included
		
		tasks.push(yield this.getTask(id));
	}
	
	return tasks;
});

PersistentTaskContext.prototype.getTask = Q.async(function*(id) {
	for (var i = 0; i < this._tasksInMemory.length; i++) {
		if (this._tasksInMemory[i].id == id)
			return this._tasksInMemory[i];
	}
	
	var data = yield fs.read(this._taskArchivePath + '/' + id + '.yaml');
	var task = yaml.safeLoad(data);
	task.plainLog = strings.stripColors(task.log);
	return task;
});

PersistentTaskContext.prototype.count = Q.async(function*() {
	if (!this._taskArchivePathInitialized)
		return Q(this._tasksInMemory.length);
	
	yield this._taskArchivePathInitialized;
	var files = yield fs.list(this._taskArchivePath);
	
	// remove the tasks that are still in memory
	files = files.filter(function(name) { 
		return !this._tasksInMemory.some(function(t) { return t.id + '.yaml' == name;});
	}.bind(this));
	
	return files.length + this._tasksInMemory.length;
});

module.exports = PersistentTaskContext;
