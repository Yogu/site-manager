var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var Promise = require('es6-promise').Promise;
var Q = require('q');

function LoadSiteTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Load';
}

LoadSiteTask.prototype = Object.create(Task.prototype);

LoadSiteTask.prototype.perform = function*() {
	try {
		this.cd(this.site.path);
		
		yield this.exec("git fetch");
		
		this.site.revision = (yield this.exec("git rev-parse HEAD")).stdout.trim();
		this.site.branch = (yield this.exec("git rev-parse --abbrev-ref HEAD")).stdout.trim();
		this.site.upstreamRevision = (yield this.exec("git rev-parse origin/" + this.site.branch)).stdout.trim();
		this.site.aheadBy = yield this._getCommitCountBetween('origin/' + this.site.branch, this.site.branch);
		this.site.behindBy = yield this._getCommitCountBetween(this.site.branch, 'origin/' + this.site.branch);
		this.site.isClean = yield this._isClean();
		
		this.site.canUpgrade = this.site.aheadBy == 0 && this.site.isClean && this.site.behindBy > 0;
		this.site.isLoaded = true;
		this.site.emit('load');
	} catch (err) {
		this.site.isLoadFailed = true;
		throw err;
	}
};

LoadSiteTask.prototype._getCommitCountBetween = Q.async(function*(a, b) {
	// wc hides errors of rev-list
	var result = yield this.exec("git rev-list " + a + ".." + b);
	return result.stdout.split("\n").length - 1;
});

LoadSiteTask.prototype._isClean = Q.async(function*() {
	try {
		// discard the index
		yield this.exec("rm .git/index ; git reset && git diff-files");
		return true;
	} catch (err) {
		if (code in err && err.code === 1) {
			this.doLog('This site is dirty (hence the error)');
			return false;
		} else
			throw err;
	}
});

module.exports = LoadSiteTask;
