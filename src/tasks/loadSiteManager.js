var Task = require('../task.js');
var Site = require('../site.js');
var yaml = require('js-yaml');
var path = require('path');
var fs = require('q-io/fs');
var extend = require('node.extend');

function LoadSiteManagerTask(siteManager) {
	Task.call(this);
	this.siteManager = siteManager;
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
	
	if (config.db)
		var baseDBConfig = config.db;
	else
		baseDBConfig = {};
		
	var newSites = [];
	for (var name in config.sites) {
		var siteConfig = config.sites[name] || {};
		var sitePath = path.resolve(manager._siteRoot, siteConfig.root ? siteConfig.root : name);
			
		var existingSites = manager.sites.filter( function(s) { return s.name == name; } );
		var site;
		if (existingSites.length > 0) {
			site = existingSites[0];
			site.path = sitePath;
		} else {
			site = new Site(name, sitePath);
			manager.emit('siteAdded', site);
		}
		
		if (siteConfig.db)
			site.dbConfig = extend(siteConfig.db, baseDBConfig);
		else
			site.dbConfig = baseDBConfig;
		if (site.dbConfig.path)
			site.dbConfig.path = path.resolve(manager.path, site.dbConfig.path);
		
		site.schedule(site.loadTask());
		newSites.push(site);
		site.setTaskArchivePath(manager._logRoot + '/' + site.name);
	}
	manager.sites = newSites;
	manager.emit('load');
};

module.exports = LoadSiteManagerTask;
