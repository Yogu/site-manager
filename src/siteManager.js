var TaskContext = require('./taskContext.js');
var Task = require('./task.js');
var Site = require('./site.js');
var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');

function SiteManager(path) {
	TaskContext.call(this);
	this.path = path;
	this.sites = [];
}

SiteManager.prototype = Object.create(TaskContext.prototype);

SiteManager.prototype.loadTask = function() {
	var self = this;
	return new Task("Load config", function(resolve, reject) {
		this.log('Loading config.yaml...');
		fs.readFile(self.path + '/config.yaml', 'utf8', function(err, data) {
			try {
				if (err)
					return reject(err);
				var config = yaml.safeLoad(data);
				
				if (config.siteRoot)
					self._siteRoot = path.resolve(self.path, config.siteRoot);
				else
					self._siteRoot = self.path;
				
				var newSites = [];
				for (var name in config.sites) {
					var siteConfig = config.sites[name] || {};
					var sitePath = path.resolve(self._siteRoot, siteConfig.root ? siteConfig.root : name);
						
					var site;
					if (name in self.sites) {
						site = self.sites[name];
						site.path = sitePath;
					} else
						site = new Site(name, sitePath);
					
					site.schedule(site.loadTask());
					newSites.push(site);
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
