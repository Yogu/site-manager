var TaskContext = require('./taskContext.js');
var Task = require('./task.js');

function Site(name, path) {
	TaskContext.call(this);
	this.name = name;
	this.path = path;
}

Site.prototype = Object.create(TaskContext.prototype);

Site.prototype.loadTask = function() {
	var self = this;
	return new Task("Load config", function(resolve, reject) {
		resolve();
	});
};

module.exports = Site;
