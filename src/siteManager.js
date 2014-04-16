var PersistentTaskContext = require('./persistentTaskContext.js');
var Task = require('./task.js');
var Site = require('./site.js');
var yaml = require('js-yaml');
var path = require('path');
var fs = require('q-io/fs');
var extend = require('node.extend');

function SiteManager(path) {
	PersistentTaskContext.call(this);
	this.path = path;
	this.sites = [];
}

SiteManager.prototype = Object.create(PersistentTaskContext.prototype);

SiteManager.prototype.loadTask = function() {
	var self = this;
	return new Task("Load config", function*() {
		this.doLog('Loading config.yaml...');
		var data = yield fs.read(self.path + '/config.yaml');
		var config = yaml.safeLoad(data);
				
		if (config.siteRoot)
			self._siteRoot = path.resolve(self.path, config.siteRoot);
		else
			self._siteRoot = self.path;
		
		if (config.logRoot)
			self._logRoot = path.resolve(self.path, config.logRoot);
		else
			self._logRoot = path.resolve(self.path, 'log');
		self.setTaskArchivePath(self._logRoot + '/_global');

		if (config.repo)
			self._repoPath = path.resolve(self.path, config.repo);
		else
			self._repoPath = path.resolve(self.path, 'repo.git');
		
		if (config.db)
			var baseDBConfig = config.db;
		else
			baseDBConfig = {};
			
		var newSites = [];
		for (var name in config.sites) {
			var siteConfig = config.sites[name] || {};
			var sitePath = path.resolve(self._siteRoot, siteConfig.root ? siteConfig.root : name);
				
			var existingSites = self.sites.filter( function(s) { return s.name == name; } );
			var site;
			if (existingSites.length > 0) {
				site = existingSites[0];
				site.path = sitePath;
			} else {
				site = new Site(name, sitePath);
				self.emit('siteAdded', site);
			}
			
			if (siteConfig.db)
				site.dbConfig = extend(siteConfig.db, baseDBConfig);
			else
				site.dbConfig = baseDBConfig;
			if (site.dbConfig.path)
				site.dbConfig.path = path.resolve(self.path, site.dbConfig.path);
			
			site.schedule(site.loadTask());
			newSites.push(site);
			site.setTaskArchivePath(self._logRoot + '/' + site.name);
		}
		self.sites = newSites;
		self.emit('load');
	});
};

SiteManager.prototype.fetchTask = function() {
	var self = this;
	return new Task("Fetch", function*() {
		this.cd(self._repoPath);
		var result = yield this.exec('git fetch origin +refs/heads/*:refs/heads/*');
		var updatedBranches = {};
		result.stderr.split("\n").forEach(function(line) {
			var matches = line.match(/^   [^ ]+ +([^ ]+) /);
			if (!matches)
				return; // this is not a ref update
			var branch = matches[1];
			updatedBranches[branch] = true;
		}.bind(this));
		updatedBranches = Object.getOwnPropertyNames(updatedBranches);
		if (!updatedBranches.length) {
			this.doLog('No branches have been updated');
			return;
		}
		
		this.doLog('The branches ' + updatedBranches.join(', ') + ' have been updated');
			
		var updatedSites = self.sites.filter(function(site) {
			return updatedBranches.indexOf(site.branch) >= 0;
		});
		if (!updatedSites.length) {
			this.doLog('No sites follow one of these branches');
			return;
		}
		this.doLog('The sites ' + updatedSites.map(function(s) { return s.name; }).join(', ') +
			' will be upgraded');
			
		updatedSites.forEach(function(site) {
			site.schedule(site.upgradeTask());
		});
	});
};

module.exports = SiteManager;
