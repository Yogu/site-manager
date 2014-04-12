var PersistentTaskContext = require('./persistentTaskContext.js');
var Task = require('./task.js');
var LoadSiteTask = require('./tasks/loadSite.js');

function Site(name, path) {
	PersistentTaskContext.call(this);
	this.name = name;
	this.path = path;
	
	this.isClean = null;
	this.aheadBy = null;
	this.behindBy = null;
	this.revision = null;
	this.branch = null;
	this.remoteRevision = null;
	this.isLoaded = false;
	this.isLoadFailed = false;
}

Site.prototype = Object.create(PersistentTaskContext.prototype);

Site.prototype.loadTask = function() {
	return new LoadSiteTask(this);
};

module.exports = Site;
