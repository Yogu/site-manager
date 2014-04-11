var PersistentTaskContext = require('./persistentTaskContext.js');
var Task = require('./task.js');
var Site = require('./site.js');
var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');

function SiteManager(path) {
	PersistentTaskContext.call(this);
	this.path = path;
	this.sites = [];
}

SiteManager.prototype = Object.create(PersistentTaskContext.prototype);

SiteManager.prototype.loadTask = function() {
	var self = this;
	return new Task("Load config", function(resolve, reject) {
		this.doLog('Loading config.yaml...');
		fs.readFile(self.path + '/config.yaml', 'utf8', function(err, data) {
			try {
				if (err)
					return reject(err);
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
					
					site.schedule(site.loadTask());
					newSites.push(site);
					site.setTaskArchivePath(self._logRoot + '/' + site.name);
				}
				self.sites = newSites;
				self.emit('load');
				resolve();
			} catch (e) {
				reject(e);
			}
		}.bind(this));
	});
};

module.exports = SiteManager;
