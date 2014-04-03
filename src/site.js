var TaskContext = require('./taskContext.js');
var Task = require('./task.js');
var LoadSiteTask = require('./tasks/loadSite.js');

function Site(name, path) {
	TaskContext.call(this);
	this.name = name;
	this.path = path;
	
	this.isClean = null;
	this.aheadBy = null;
	this.behindBy = null;
	this.revision = null;
	this.branch = 'master';
}

Site.prototype = Object.create(TaskContext.prototype);

Site.prototype.loadTask = function() {
	return new LoadSiteTask(this);
};

module.exports = Site;
