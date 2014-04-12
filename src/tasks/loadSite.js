var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var Promise = require('es6-promise').Promise;

function LoadSiteTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Load';
}

LoadSiteTask.prototype = Object.create(Task.prototype);

LoadSiteTask.prototype.perform = function(resolve, reject) {
	this.cd(this.site.path);
	var self = this;
	var site = self.site;
	
	this._fetch()
		.then(function() { return self._getRevision(); })
		.then(function() { return self._getBranch(); })
		.then(function() { return self._getUpstreamRevision(); })
		.then(function() { return self._getAheadBy(); })
		.then(function() { return self._getBehindBy(); })
		.then(function() { return self._getIsClean(); })
		.then(function() {
			site.canUpgrade = site.aheadBy == 0 && site.isClean && site.behindBy > 0;
			site.isLoaded = true;
			site.emit('load');
		})
		.catch(function(err) { self.site.isLoadFailed = true; throw err; })
		.then(resolve, reject);
};

LoadSiteTask.prototype._fetch = function() {
	return this.exec("git fetch");
};

LoadSiteTask.prototype._getBranch = function() {
	return this.exec("git rev-parse --abbrev-ref HEAD")
		.then(function(result) {
			this.site.branch = result.stdout.trim();
		}.bind(this));
};

LoadSiteTask.prototype._getRevision = function() {
	return this.exec("git rev-parse HEAD").then(function(result) {
		this.site.revision = result.stdout.trim();
	}.bind(this));
};

LoadSiteTask.prototype._getUpstreamRevision = function() {
	return this.exec("git rev-parse origin/" + this.site.branch).then(function(result) {
		this.site.upstreamRevision = result.stdout.trim();
	}.bind(this));
};

LoadSiteTask.prototype._getAheadBy = function() {
	var cmd = "git rev-list origin/" + this.site.branch + ".." + this.site.branch + " | wc -l";
	return this.exec(cmd).then(function(result) {
		this.site.aheadBy = parseInt(result.stdout.trim());
	}.bind(this));
};

LoadSiteTask.prototype._getBehindBy = function() {
	var cmd = "git rev-list " + this.site.branch + "..origin/" + this.site.branch + " | wc -l";
	return this.exec(cmd).then(function(result) {
		this.site.behindBy = parseInt(result.stdout.trim());
	}.bind(this));
};

LoadSiteTask.prototype._getIsClean = function() {
	// discard the index
	var cmd = "rm .git/index ; git reset && git diff-files --quiet";
	return new Promise(function(resolve, reject) {
		this.exec(cmd).then(function() {
			this.site.isClean = true;
			resolve();
		}.bind(this), function(e) {
			if (e.code == 1) {
				this.site.isClean = false;
				this.doLog('This site is dirty (hence the error)');
				resolve();
			} else {
				reject();
			}
		}.bind(this));
	}.bind(this));
};

module.exports = LoadSiteTask;
