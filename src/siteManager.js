var PersistentTaskContext = require('./persistentTaskContext.js');
var Task = require('./task.js');
var FetchTask = require('./tasks/fetch.js');
var LoadSiteManagerTask = require('./tasks/loadSiteManager.js');

function SiteManager(path) {
	PersistentTaskContext.call(this);
	this.path = path;
	this.sites = [];
}

SiteManager.prototype = Object.create(PersistentTaskContext.prototype);

SiteManager.prototype.loadTask = function() {
	return new LoadSiteManagerTask(this);
};

SiteManager.prototype.fetchTask = function() {
	return new FetchTask(this);
};

module.exports = SiteManager;
