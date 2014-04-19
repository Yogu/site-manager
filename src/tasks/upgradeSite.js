var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var Promise = require('es6-promise').Promise;
var MigrateTask = require('./migrate.js');

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
	
	try {
		this.doLog('Pulling incoming commits...');
		yield this.exec('git pull --ff-only');
		
		this.doLog('Pull completed');
		yield this.runNestedQuietly(site.loadTask());
		
		yield this.runNested(new MigrateTask(site));
		
		this.doLog('Upgrade succeeded'.green);
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
		throw err;
	}
};

module.exports = UpgradeSiteTask;
