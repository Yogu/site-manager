var Task = require('../task.js');
var Site = require('../site.js');
var yaml = require('js-yaml');
var path = require('path');
var fs = require('q-io/fs');
var extend = require('node.extend');

function LoadSiteManagerTask(siteManager, loadSites) {
	Task.call(this);
	this.siteManager = siteManager;
	this.loadSites = loadSites;
	this.name = 'Load';
}

LoadSiteManagerTask.prototype = Object.create(Task.prototype);

LoadSiteManagerTask.prototype.perform = function*() {
	var manager = this.siteManager;
	this.doLog('Loading config.yaml...');
	var data = yield fs.read(manager.path + '/config.yaml');
	var config = yaml.safeLoad(data);

	if (config.siteRoot)
		manager._siteRoot = path.resolve(manager.path, config.siteRoot);
	else
		manager._siteRoot = manager.path;

	if (config.logRoot)
		manager._logRoot = path.resolve(manager.path, config.logRoot);
	else
		manager._logRoot = path.resolve(manager.path, 'log');
	manager.setTaskArchivePath(manager._logRoot + '/_global');

	if (config.repo)
		manager._repoPath = path.resolve(manager.path, config.repo);
	else
		manager._repoPath = path.resolve(manager.path, 'repo.git');

	if (config.backupRepo)
		manager.backupRepoPath = path.resolve(manager.path, config.backupRepo);
	else
		manager.backupRepoPath = path.resolve(manager.path, 'backups.git');

	if (config.db)
		var baseDBConfig = config.db;
	else
		baseDBConfig = {};

	var globalWatchers = config.watchers || [];
	manager.ownURL = config.ownURL || 'http://localhost:8888/';
	manager.mailConfig = config.mail || { transport: 'sendmail', sender: 'Site Manager <site-manager@example.com>' };
	manager.config = config;
	manager.siteBranchMapping = config.siteBranchMapping || {};

	var sites = yaml.safeLoad(yield fs.read(manager.path + '/sites.yaml'));

	var newSites = [];
	for (var name in sites) {
		var siteConfig = sites[name] || {};
		var sitePath = path.resolve(manager._siteRoot, siteConfig.root ? siteConfig.root : name);

		var existingSites = manager.sites.filter( function(s) { return s.name == name; } );
		var site;
		if (existingSites.length > 0) {
			site = existingSites[0];
			site.path = sitePath;
		} else {
			site = new Site(name, sitePath);
			site.siteManager = manager;
			manager.emit('siteAdded', site);
		}

		if (siteConfig.db)
			site.dbConfig = extend(siteConfig.db, baseDBConfig);
		else
			site.dbConfig = baseDBConfig;
		if (site.dbConfig.path)
			site.dbConfig.path = path.resolve(manager.path, site.dbConfig.path);

		site.config = siteConfig;
		site.watchers = globalWatchers.concat(siteConfig.watchers || []);
		site.ownURL = manager.ownURL + '#/sites/' + site.name;
		site.stagingOf = siteConfig.stagingOf;
		site.isMergeRequestSite = siteConfig.isMergeRequestSite;
		site.sourceBranch = siteConfig.sourceBranch;

		if (this.loadSites || existingSites.length == 0 /* always load new sites */)
			site.schedule(site.loadTask());
		newSites.push(site);
		site.setTaskArchivePath(manager._logRoot + '/' + site.name);
	}
	manager.sites = newSites;
	manager.emit('load');
};

module.exports = LoadSiteManagerTask;
