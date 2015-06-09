var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var Promise = require('es6-promise').Promise;
var hooks = require('../hooks.js');

function UpgradeSiteTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Upgrade';
}

UpgradeSiteTask.prototype = Object.create(Task.prototype);

UpgradeSiteTask.prototype.perform = function*() {
	var site = this.site;
	this.cd(this.site.path);

	this.doLog('Checking if site can be upgraded...');
	yield this.runNestedQuietly(this.site.loadTask());

	if (!this.site.canUpgrade)
		throw new Error("Can not upgrade");

	this.doLog('Upgrade is possible. Backing up...');
	var backupRevision = yield this.runNested(site.backupTask(
			'pre-upgrade ' + site.revision + '..' + site.upstreamRevision));

	var oldRevision = site.revision;
	try {
		if (this.site.stagingOf) {
			this.doLog('This is a staging site, resetting to ' + this.site.stagingOf + '...');
			// skip the backup pre-restore because we already made a backup
			yield this.runNested(site.resetStagingTask( { backup: false }));
		}

		if (this.site.isMergeRequestSite) {
			this.doLog('Merging source branch ' + this.site.sourceBranch + '...');
			yield this.exec('git merge --no-ff origin/' + this.site.sourceBranch);
			this.doLog('Merge completed');
		} else {
			this.doLog('Pulling incoming commits...');
			yield this.exec('git pull --ff-only');
			this.doLog('Pull completed');
		}

		yield this.runNestedQuietly(site.loadTask());

		yield hooks.call('afterPull', this, site);
		yield hooks.call('afterCheckout', this, site);
	} catch(err) {
		this.doLog('Upgrade failed. Restoring backup...'.red);
		try {
			yield this.runNested(site.restoreTask(backupRevision));
		} catch (restoreErr) {
			this.doLog('Restore failed! The site is now in an inconsistent state.'.bold.red);
			this.doLog('Restore error:');
			if (typeof restoreErr == 'object' && restoreErr.stack)
				restoreErr = restoreErr.stack;
			this.doLog(restoreErr);
			this.doLog('The upgrade error follows:');
		}

		yield hooks.call('upgradeFailed', this, site, { errorLog: this.plainLog, upgradeTaskID: this.id } );
		throw err;
	}

	this.doLog('Upgrade succeeded'.green);
	yield hooks.call('afterUpgrade', this, site, { upgradeTaskID: this.id, oldRevision: oldRevision });
};

module.exports = UpgradeSiteTask;
