var Task = require('../task.js');
var ShellTask = require('../tasks/shell.js');
var hooks = require('../hooks.js');

/**
 * Upgrades a site to a specific revision
 */
function UpgradeToRevisionTask(site, revision) {
	Task.call(this);
	this.site = site;
	this.name = 'Upgrade to ' + revision;
	this.revision = revision;
}

UpgradeToRevisionTask.prototype = Object.create(Task.prototype);

UpgradeToRevisionTask.prototype.perform = function*() {
	var site = this.site;
	this.cd(this.site.path);

	yield this.exec('git fetch');

	var commitsAhead = yield countCommitsBetween(this, 'HEAD', this.revision);
	var commitsBehind = yield countCommitsBetween(this, this.revision, 'HEAD');

	if (commitsBehind > 0) {
		throw new Error('The upgrade is not fast-forward, this site is ' +
			commitsBehind + ' commits ahead of ' + this.revision + '. To go back to ' +
			'an older version, either restore a backup or do a git revert.');
	}

	if (commitsAhead == 0) {
		this.doLog('Already up-to-date.');
		return;
	}

	this.doLog('Upgrade is possible, ' + commitsAhead + ' incoming commits. Backing up...');
	var backupRevision = yield this.runNested(site.backupTask(
			'pre-upgrade ' + site.revision + '..' + this.revision));

	var oldRevision = site.revision;
	try {
		this.doLog('Checking ot new revision...');
		yield this.exec('git checkout ' + this.revision);
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

function countCommitsBetween(task, a, b) {
	return task.exec('git rev-list ' + a + '..' + b + ' --count')
		.then(function(result) {
			return parseInt(result.stdout);
		});
}

module.exports = UpgradeToRevisionTask;
