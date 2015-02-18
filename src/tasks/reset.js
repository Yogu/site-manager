var Task = require('../task.js');
var fs = require('q-io/fs');
var Q = require('q');
var hooks = require('../hooks.js');
require('colors');

function ResetTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Reset';
}

ResetTask.prototype = Object.create(Task.prototype);

ResetTask.prototype.perform = function*() {
	var site = this.site;

	var backupRevision = yield this.runNested(this.site.backupTask("pre-reset"));

	try {
		// Remove all data
		var fileNames = yield fs.list(site.path + '/data');
		fileNames = fileNames.filter(function(name) { return name != '.git'; });
		this.doLog('Removing everything in data/ directory...');
		yield Q.all(fileNames.map(function(name) { return fs.removeTree(site.path + '/data/' + name); }));

		yield hooks.call('reset', this, site);

		this.doLog('Reset succeeded'.green);
	} catch (err) {
		this.doLog('Reset failed. Restoring backup...'.red);
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

module.exports = ResetTask;
