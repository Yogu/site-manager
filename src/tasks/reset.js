var Task = require('../task.js');
var fs = require('q-io/fs');
var Q = require('q');
require('colors');
var MigrateTask = require('./migrate.js');

function ResetTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Reset';
}

ResetTask.prototype = Object.create(Task.prototype);

ResetTask.prototype.perform = function*() {
	var site = this.site;
	
	yield this.runNested(this.site.backupTask("pre-reset"));
	
	// Remove all data
	var fileNames = yield fs.list(site.path + '/data');
	fileNames = fileNames.filter(function(name) { return name != '.git'; });
	this.doLog('Removing everything in data/ directory...');
	yield Q.all(fileNames.map(function(name) { return fs.removeTree(site.path + '/data/' + name); }));
	
	// Reset data base
	var db = yield site.getDB();
	if (!db) {
		this.doLog('This site does not have a database');
		return;
	}
	
	var baselinePath = site.path + '/database/baseline.sql';
	if (!(yield fs.exists(baselinePath))) {
		this.doLog('database/baseline.sql does not exist, so not resetting database.'.bold.yellow);
		return;
	}
	
	var baselineSQL = yield fs.read(baselinePath);
	this.doLog('Resetting database with database/baseline.sql...');
	yield db.clear();
	yield db.exec(baselineSQL);
	
	this.doLog('Applying all migrations...');
	yield this.runNested(new MigrateTask(site));
};

module.exports = ResetTask;
