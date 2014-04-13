var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var Promise = require('es6-promise').Promise;

function UpgradeSiteTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Upgrade';
}

UpgradeSiteTask.prototype = Object.create(Task.prototype);

UpgradeSiteTask.prototype.perform = function*() {
	this.cd(this.site.path);
	
	this.doLog('Checking if site can be upgraded...');
	yield this.runNested(this.site.loadTask());
	
	if (!this.site.canUpgrade)
		throw new Error("Can not upgrade");

	this.doLog('Upgrade is possible. Pulling incoming commits...');
	yield this.exec('git pull');
	
	this.doLog('Upgrade completed. Updating site information');
	yield this.runNested(this.site.loadTask());
};

module.exports = UpgradeSiteTask;
