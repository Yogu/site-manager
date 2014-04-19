var PersistentTaskContext = require('./persistentTaskContext.js');
var Task = require('./task.js');
var FetchTask = require('./tasks/fetch.js');
var LoadSiteManagerTask = require('./tasks/loadSiteManager.js');
var AddSiteTask = require('./tasks/addSite.js');

// Register common hooks
require('./hooks/common.js');

function SiteManager(path) {
	PersistentTaskContext.call(this);
	this.path = path;
	this.sites = [];
}

SiteManager.prototype = Object.create(PersistentTaskContext.prototype);

SiteManager.prototype.loadTask = function(loadSites) {
	if (loadSites === undefined)
		loadSites = true;
	return new LoadSiteManagerTask(this, loadSites);
};

SiteManager.prototype.fetchTask = function() {
	return new FetchTask(this);
};

SiteManager.prototype.addSiteTask = function(siteName, branch) {
	return new AddSiteTask(this, siteName, branch);
}

module.exports = SiteManager;
