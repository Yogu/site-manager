var TaskContext = require('./taskContext.js');
var yaml = require('js-yaml');
var objects = require('./objects.js');
var fs = require('fs');
var Promise = require('es6-promise').Promise;
var mkdirp = require('mkdirp');

/**
 * A task context that archives logs of succeeded and failed tasks
 * @param path the path to store the logs in
 */
function PersistentTaskContext(path) {
	TaskContext.call(this);
	this._taskArchivePathSet = new Promise(function(resolve) { 
		this._resolveTaskArchivePathSet = resolve;
	}.bind(this));
	if (path)
		this.setTaskArchivePath(path);
	this._tasksInMemory = [];
	
	this.on('schedule', function(task) {
		this._tasksInMemory.unshift(task);
	}.bind(this));
	
	this.on('done', this._archiveTask.bind(this));
	this.on('fail', this._archiveTask.bind(this));
}

PersistentTaskContext.prototype = Object.create(TaskContext.prototype);

PersistentTaskContext.prototype.setTaskArchivePath = function(path) {
	this._taskArchivePathInitialized = new Promise(function(resolve) {
		mkdirp(path, function(err) {
			if (err)
				throw err;
			this._taskArchivePath = path;
			this._resolveTaskArchivePathSet();
			resolve();
		}.bind(this));
	}.bind(this));
};

PersistentTaskContext.prototype._archiveTask = function(task) {
	this._taskArchivePathSet
		.then(function() {
			return this._saveTask(task);
		}.bind(this))
		.then(function() {
			this._tasksInMemory = this._tasksInMemory.filter(function(t) { return t != task; });
		}.bind(this))
		.catch(function(e) { console.error(e.stack); });
}

PersistentTaskContext.prototype._saveTask = function(task) {
	return new Promise(function(resolve, reject) {
		var path = this._taskArchivePath + '/' + task.id + '.yaml';
		var serialized = yaml.safeDump(objects.extract(task, ['id', 'name', 'status', 'log']));
		
		fs.writeFile(path, serialized, function(err) {
			if (err)
				return reject(err);
			resolve();
		}.bind(this));
	}.bind(this));
};

PersistentTaskContext.prototype.getTasks = function(offset, count) {
	return new Promise(function(resolve, reject) {
		var tasks = [];
		if (offset < this._tasksInMemory.length) {
			tasks = this._tasksInMemory.slice(offset, offset + count);
			count -= tasks.length;
		}
		
		// when an archive path is set, wait until it is initialized
		if (count > 0 && this._taskArchivePathInitialized) {
			this._taskArchivePathInitialized.then(function() {
				// we need tasks from disk
				fs.readdir(this._taskArchivePath, function(err, files) {
					if (err)
						reject(err);
					try {
						var previousPromise = new Promise(function(r) { r();});
						files.reverse(); // newest first
						files.slice(offset, offset + count).forEach(function(fileName) {
							if (fileName.substr(-5) != '.yaml')
								return;
							var id = fileName.substr(0, fileName.length - 5);
							if (tasks.some(function(t) { return t.id == id;}))
								return // task is already included
							
							previousPromise = previousPromise
								.then(function() { return this.getTask(id); }.bind(this))
								.then(function(task) { tasks.push(task);});
						}.bind(this));
						previousPromise.then(function() { resolve(tasks);}, reject);
					} catch (e) {
						reject(e);
					}
				}.bind(this));
			}.bind(this));
		} else
			resolve(tasks);
	}.bind(this));
};

PersistentTaskContext.prototype.getTask = function(id) {
	return new Promise(function(resolve, reject) {
		fs.readFile(this._taskArchivePath + '/' + id + '.yaml', 'utf8', function(err, data) {
			if (err)
				return reject(err);
			var task = yaml.safeLoad(data);
			resolve(task);
		}.bind(this));
	}.bind(this));
};

PersistentTaskContext.prototype.count = function() {
	if (!this._taskArchivePathInitialized)
		return new Promise(function(resolve) { resolve(this._tasksInMemory.length) }.bind(this));

	return this._taskArchivePathInitialized
	.then(function() {
		return new Promise(function(resolve, reject) {
			fs.readdir(this._taskArchivePath, function(err, files) {
				if (err)
					return reject(err);
				// remove the tasks that are still in memory
				files = files.filter(function(name) { 
					return !this._tasksInMemory.some(function(t) { return t.id + '.yaml' == name;});
				}.bind(this));
				resolve(files.length + this._tasksInMemory.length);
			}.bind(this));
		}.bind(this));
	}.bind(this));
};

module.exports = PersistentTaskContext;
