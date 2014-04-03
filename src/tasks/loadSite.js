var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var Promise = require('es6-promise').Promise;

function LoadSiteTask(site) {
	Task.call(this);
	this.site = site;
}

LoadSiteTask.prototype = Object.create(Task.prototype);

LoadSiteTask.prototype.perform = function(resolve, reject) {
	this.cd(this.site.path);
	var self = this;
	
	this._fetch()
		.then(function() { return self._getRevision(); })
		.then(function() { return self._getBranch(); })
		.then(function() { return self._getAheadBy(); })
		.then(function() { return self._getBehindBy(); })
		.then(function() { return self._getIsClean(); })
		.then(resolve, reject);
};

LoadSiteTask.prototype._fetch = function() {
	return this.exec("git fetch");
};

LoadSiteTask.prototype._getBranch = function() {
	return this.exec("git rev-parse --abbrev-ref HEAD")
		.then(function(result) {
			this.site.branch = result.trim();
		}.bind(this));
};

LoadSiteTask.prototype._getRevision = function() {
	return this.exec("git rev-parse HEAD").then(function(result) {
		this.site.revision = result.trim();
	}.bind(this));
};

LoadSiteTask.prototype._getAheadBy = function() {
	var cmd = "git rev-list origin/" + this.site.branch + ".." + this.site.branch + " --count";
	return this.exec(cmd).then(function(result) {
		this.site.aheadBy = parseInt(result.trim());
	}.bind(this));
};

LoadSiteTask.prototype._getBehindBy = function() {
	var cmd = "git rev-list " + this.site.branch + "..origin/" + this.site.branch + " --count";
	return this.exec(cmd).then(function(result) {
		this.site.behindBy = parseInt(result.trim());
	}.bind(this));
};

LoadSiteTask.prototype._getIsClean = function() {
	// diff-files reports lots of files. that is fixed if git status is called before
	var cmd = "git status && git diff-index --quiet --cached HEAD && git diff-files --quiet";
	return new Promise(function(resolve, reject) {
		this.exec(cmd).then(function() {
			this.site.isClean = true;
			resolve();
		}.bind(this), function(e) {
			if (e.code == 1) {
				this.site.isClean = false;
				this.log('This site is dirty (hence the error)');
				resolve();
			} else {
				reject();
			}
		}.bind(this));
	}.bind(this));
};

module.exports = LoadSiteTask;
