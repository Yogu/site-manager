var Task = require('../task.js');
var Q = require('q');
var fs = require('q-io/fs');

/**
 * Resets a staging site to its production site by restoring a backup of production
 */
function ResetStagingTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Reset to ' + site.stagingOf;
}

ResetStagingTask.prototype = Object.create(Task.prototype);

ResetStagingTask.prototype.perform = function*() {
	var site = this.site;

	if (!site.stagingOf) {
		throw new Error('This is not a staging site, stagingOf is not set in config');
	}

	var productionSite = site.siteManager.getSite(site.stagingOf);
	if (!productionSite) {
		throw new Error('This is configured to be staging of ' + site.stagingOf +
			', but that site does not exist.');
	}

	var backupTask = productionSite.backupTask("for reset of " + site.name);
	productionSite.schedule(backupTask);
	this.doLog('Waiting for backup of ' + site.stagingOf + ' to complete...');
	var backupRevision = yield backupTask;
	this.doLog('Backup completed with revision ' + backupRevision + ', restoring that...');
	yield this.runNested(site.restoreTask(backupRevision));
};

module.exports = ResetStagingTask;
