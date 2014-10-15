var PersistentTaskContext = require('./persistentTaskContext.js');
var Task = require('./task.js');
var LoadSiteTask = require('./tasks/loadSite.js');
var UpgradeSiteTask = require('./tasks/upgradeSite.js');
var backups = require('./tasks/backup.js');
var BackupTask = backups.BackupTask;
var RestoreTask = backups.RestoreTask;
var ResetTask = require('./tasks/reset.js');
var databases = require('./databases');
var Q = require('q');
var fs = require('q-io/fs');

function Site(name, path) {
	PersistentTaskContext.call(this);
	this.name = name;
	this.path = path;
	
	this.isClean = null;
	this.aheadBy = null;
	this.behindBy = null;
	this.revision = null;
	this.branch = null;
	this.upstreamRevision = null;
	this.isLoaded = false;
	this._loadedDeferred = Q.defer();
	this.loaded = this._loadedDeferred.promise;
	this.isLoadFailed = false;
	this.dbConfig = { };
	this.watchers = [];
}

Site.prototype = Object.create(PersistentTaskContext.prototype);

Site.prototype.loadTask = function() {
	return new LoadSiteTask(this);
};

Site.prototype.upgradeTask = function() {
	return new UpgradeSiteTask(this);
};

Site.prototype.backupTask = function(message) {
	return new BackupTask(this, message);
};

Site.prototype.restoreTask = function(revision) {
	return new RestoreTask(this, revision);
};

Site.prototype.resetTask = function() {
	return new ResetTask(this);
};

Site.prototype.getDB = function() {
	return databases.connect(this.dbConfig);
};

Site.prototype.getBackups = function() {
	return backups.getBackups(this);
};

Site.prototype.getBackup = function(revision) {
	return backups.getBackup(this, revision);
};

Site.prototype.modifyConfig = Q.async(function*(changer) {
	var sites = yaml.safeLoad(yield fs.read(this.siteManager.path + '/sites.yaml'));
	var site = sites[this.name];
	if (!site)
		throw new Error('site ' + this.name + ' not found in sites.yaml');
	changer(site);
	yield fs.write(this.siteManager.path + '/sites.yaml', yaml.safeDump(sites));
});

module.exports = Site;
