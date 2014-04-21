var Task = require('../task.js');
var Promise = require('es6-promise').Promise;
var fs = require('q-io/fs');

function MigrateTask(site) {
	Task.call(this);
	this.site = site;
	this.name = 'Migrate';
}

MigrateTask.prototype = Object.create(Task.prototype);

MigrateTask.prototype.perform = function*() {
	var site = this.site;
	
	var relativeMigrationsPath = 'database/migrations';
	var migrationsPath = site.path + '/' + relativeMigrationsPath;
	if (!(yield fs.exists(migrationsPath))) {
		this.doLog('Migrations directory (' + relativeMigrationsPath + 
				') does not exist, nothing to do');
		return;
	}
	
	// get the names of migration files that could be applied
	var allMigrations = [];
	var fileNames = yield fs.list(migrationsPath);
	fileNames.forEach(function(fileName) {
		if (fileName.match(/\.sql$/))
			allMigrations.push(fileName.replace(/\.sql$/, ''));
	});
	
	var db = yield site.getDB();
	if (!db) {
		this.doLog('This site does not have a database, nothing to migrate');
		return;
	}
	
	// Get the names of migrations that have already been applied
	var appliedMigrations = (yield db.exec("SELECT version FROM schema_migrations"))
		.map(function(row) {
			return row.version;
		});
	
	// Calculate the difference
	var availableMigrations = allMigrations.filter(function(m) {
		return appliedMigrations.indexOf(m) < 0;
	});
	
	this.doLog(availableMigrations.length + ' migration(s) available (' +
		allMigrations.length + ' migration file(s) exist, ' + appliedMigrations.length +
		' migration(s) already applied');
	
	// Apply all not-yet-applied migrations
	for (var i = 0; i < availableMigrations.length; i++) {
		var migration = availableMigrations[i];
		this.doLog('migrate ' + migration);
		
		var sql = yield fs.read(migrationsPath + '/' + migration + '.sql');
		yield db.exec(sql);
		yield db.exec('INSERT INTO schema_migrations (version, run_time) VALUES ' +
				'(?, ' + db.snippets.now + ');', 
				[ migration ]);
	}
};

module.exports = MigrateTask;
