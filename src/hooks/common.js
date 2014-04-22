var hooks = require('../hooks.js');
var MigrateTask = require('../tasks/migrate.js');
var Task = require('../task.js');
var fs = require('q-io/fs');
require('colors');
var MailTask = require('../tasks/mail.js');

hooks.register('afterPull', function(site) {
	return new MigrateTask(site);
});

hooks.register('beforeBackup', function(site) {
	return new Task('Dump Data Base', function*() {
		db = yield site.getDB();
		if (!db) {
			this.doLog('This site does not have a data base');
			return;
		}
		
		var path = site.path + '/data/database.sql';
		yield db.dump(path);
	});
});

hooks.register('afterRestore', function(site) {
	return new Task('Restore Data Base', function*() {
		db = yield site.getDB();
		if (!db) {
			this.doLog('This site does not have a data base');
			return;
		}

		var path = site.path + '/data/database.sql';
		if (!(yield fs.exists(path))) {
			this.doLog('No database dump found in the data directory!'.yellow.bold);
			return;
		}

		yield db.restore(path);
	});
});

hooks.register('afterUpgrade', function(site, args) {
	if (!site.watchers.length)
		return;

	return new Task('Notify watchers', function*() {
		this.cd(site.path);
		var log = (yield this.execQuietly('git log --pretty=format:"%h%x09%an%x09%ad%x09%s" ' +
			args.oldRevision + '..' + site.revision)).stdout;
		var content = 'The site ' + site.name + ' has been upgraded. New commits:\n\n' + log + '\n\n' +
			site.ownURL + '/tasks/' + args.upgradeTaskID;

		yield this.runNested(new MailTask(site.siteManager.mailConfig, site.name + ' has been upgraded', content, site.watchers));
	});
});

hooks.register('upgradeFailed', function(site, args) {
	if (!site.siteManager.config.notifyLastCommitterOnFailedUpgrade && !site.watchers.length)
		return;

	return new Task('Notify last committer', function*() {
		this.cd(site.path);
		var lastCommitter = yield this.execQuietly("git --no-pager show -s --format='%ae' " + site.upstreamRevision);
		var recipients = site.watchers;
		if (recipients.indexOf(lastCommitter) < 0 && site.siteManager.config.notifyLastCommitterOnFailedUpgrade)
			recipients = recipients.concat([lastCommitter]);

		var content = 'Error upgrading site ' + site.name + '. Error log:\n\n' + args.errorLog + '\n\n' +
			site.ownURL + '/tasks/' + args.upgradeTaskID;

		yield this.runNested(new MailTask(site.siteManager.mailConfig, 'Error upgrading site ' + site.name, content, recipients));
	});
});
