var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var Promise = require('es6-promise').Promise;

function UpgradeSiteTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Upgrade';
}

UpgradeSiteTask.prototype = Object.create(Task.prototype);

UpgradeSiteTask.prototype.perform = function(resolve, reject) {
	this.cd(this.site.path);
	var self = this;
	var site = self.site;
	
	this.doLog('Checking if site can be upgraded...');
	this.runNested(site.loadTask())
		.then(function() {
			if (!site.canUpgrade)
				throw new Error("Can not upgrade");
		})
		.then(function() {
			self.doLog('Upgrade is possible. Pulling incoming commits...');
			return self.exec('git pull');
		})
		.then(function() {
			self.doLog('Upgrade completed. Updating site information');
			return self.runNested(site.loadTask());
		})
		.then(resolve, reject);
};

module.exports = UpgradeSiteTask;
