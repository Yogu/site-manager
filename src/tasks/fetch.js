var Task = require('../task.js');

function FetchTask(siteManager) {
	Task.call(this);
	this.siteManager = siteManager;
	this.name = 'Fetch';
}

FetchTask.prototype = Object.create(Task.prototype);

FetchTask.prototype.perform = function*() {
	var manager = this.siteManager;
	
	this.cd(manager._repoPath);
	var result = yield this.exec('git fetch origin +refs/heads/*:refs/heads/*');
	var updatedBranches = {};
	result.stderr.split("\n").forEach(function(line) {
		var matches = line.match(/^ [+ ] [^ ]+ +([^ ]+) /);
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
		
	var updatedSites = manager.sites.filter(function(site) {
		return updatedBranches.indexOf(site.branch) >= 0;
	});
	if (!updatedSites.length) {
		this.doLog('No sites follow one of these branches');
		return;
	}
	this.doLog('The sites ' + updatedSites.map(function(s) { return s.name; }).join(', ') +
		' will be upgraded');
		
	updatedSites.forEach(function(site) {
		site.scheduleUpgradeOrConfirmation();
	});
};

module.exports = FetchTask;
