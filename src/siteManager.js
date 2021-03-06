var PersistentTaskContext = require('./persistentTaskContext.js');
var Task = require('./task.js');
var FetchTask = require('./tasks/fetch.js');
var LoadSiteManagerTask = require('./tasks/loadSiteManager.js');
var AddSiteTask = require('./tasks/addSite.js');
var DeleteSiteTask = require('./tasks/deleteSite.js');
var CreateMergeRequestSiteTask = require('./tasks/createMergeRequestSite.js');
var Config = require('./config.js');

// Register common hooks
require('./hooks/common.js');

function SiteManager(path) {
	PersistentTaskContext.call(this);
	this.path = path;
	this.sites = [];
	this.properties = new Config(path + '/properties.json')
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
};

SiteManager.prototype.deleteSiteTask = function(site) {
	return new DeleteSiteTask(this, site);
};

SiteManager.prototype.createMergeRequestSiteTask = function(siteName, sourceBranch, targetBranch) {
	return new CreateMergeRequestSiteTask(this, siteName, sourceBranch, targetBranch)
};

SiteManager.prototype.getSite = function(siteName) {
	for (var i = 0; i <  this.sites.length; i++) {
		if (this.sites[i].name == siteName)
			return this.sites[i];
	}
	return null;
};

module.exports = SiteManager;
