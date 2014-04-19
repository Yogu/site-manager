var hooks = require('../hooks.js');
var MigrateTask = require('../tasks/migrate.js');
var Task = require('../task.js');
var fs = require('q-io/fs');
require('colors');

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
	return new Task('R Data Base', function*() {
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
