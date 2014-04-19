var Task = require('../task.js');
var fs = require('q-io/fs');
var ShellTask = require('./shell.js');
var Q = require('q');
require('colors');

function BackupTask(site, message) {
	Task.call(this);
	this.site = site;
	this.name = 'Backup (' + message + ')';
	this.message = message;
}

BackupTask.prototype = Object.create(Task.prototype);

BackupTask.prototype.perform = function*() {
	var site = this.site;
	var dataPath = fs.join(site.path, 'data');
	
	if (!(yield fs.exists(dataPath + '/.git')))
		yield this.runNested(new InitDataDirectoryTask(site));
	
	this.cd(dataPath);
	yield this.exec('git add -A');
	yield this.exec('git commit --allow-empty -m ' + ShellTask.escape(this.message));

	this.doLog('Backup succeeded'.green);
	var revision = (yield this.exec("git rev-parse HEAD")).stdout.trim();
	
	site.emit('backup');
	
	return revision;
};


function RestoreTask(site, revision) {
	Task.call(this);
	this.site = site;
	this.name = 'Restore backup ' + revision;
	this.revision = revision;
}

RestoreTask.prototype = Object.create(Task.prototype);

RestoreTask.prototype.perform = function*() {
	var site = this.site;
	var dataPath = fs.join(site.path, 'data');
	
	if (!(yield fs.exists(dataPath + '/.git')))
		yield this.runNested(new InitDataDirectoryTask(site));
	this.cd(dataPath);
	
	// To be safe, backup first
	yield this.runNested(new BackupTask(site, 'pre-restore ' + this.revision));
	
	// Add a tag so that the old revision can be reached
	var lastTag = (yield this.exec('git tag -l "' + site.name + '.*" | sort | tail -n 1')).stdout.trim();
	var lastTagNumber = lastTag ? parseInt(lastTag.substr(4)) : 0;
	yield this.exec('git tag ' + site.name + '.' + (lastTagNumber + 1));
	
	yield this.exec('git reset --hard ' + this.revision);
	
	this.doLog('Backup restored'.green);
	
	site.emit('restore');
};

function InitDataDirectoryTask(site) {
	Task.call(this);
	this.name = 'Initialize data directory for ' + site.name;
	this.site = site;
}

InitDataDirectoryTask.prototype = Object.create(Task.prototype);

InitDataDirectoryTask.prototype.perform = function*() {
	var site = this.site;
	var dataPath = fs.join(site.path, 'data');
	this.cd(site.path);
	this.doLog('data does not exist or is not a git repository, initializing it...'.yellow.bold);
	yield this.exec('git init data');
	this.cd(dataPath);
	yield this.exec('git checkout -b ' + ShellTask.escape(site.name));
	// symlink, many things, similar to git-new-workdir, but so that it works with a bare
	// root repo
	var symlinks = [ 'logs/refs/', 'objects/', 'packed-refs', 'refs/' ];
	var backupRepoPath = site.siteManager.backupRepoPath;
	
	if (!(yield fs.exists(fs.join(dataPath, '.git/logs'))))
		yield fs.makeDirectory(fs.join(dataPath, '.git/logs'));
	
	for (var i = 0; i < symlinks.length; i++) {
		var name = symlinks[i];
		var linkPath = fs.join(dataPath, '.git', name);
		var relativeBackupRepoPath = yield fs.relative(fs.directory(linkPath), backupRepoPath)
		var targetPath = fs.join(relativeBackupRepoPath, name);
		if (yield fs.exists(linkPath))
			yield fs.removeTree(linkPath);
		var isDir = name[name.length - 1] == '/';
		yield fs.symbolicLink(linkPath, targetPath, isDir ? 'file' : 'directory');
	}
};

exports.getBackups = Q.async(function*(site) {
	if (!(yield fs.exists(site.path + '/data/.git')))
		return []; // no data, so no backups
	
	var result = yield ShellTask.exec('git log --tags="' + site.name + '.*" --graph ' +
			'--pretty=format:"%H%x09%at%x09%s" ' + site.name /* match the branch */,
			site.path + '/data');
	return result.stdout.split('\n').map(function(line) {
		var matches = line.match(/^([^0-9a-f]+)\s*([0-9a-f]+)\s*([0-9]+)\s*(.*)$/);
		if (!matches) {
			if (line != '')
				return {
					type: 'guide',
					prefix: line
				};
			else
				return null;
		}
		
		return {
			type: 'backup',
			prefix: matches[1],
			revision: matches[2],
			time: new Date(matches[3] * 1000),
			message: matches[4]
		};
	})
	.filter(function(v) { return v; }); // remove null entries
});

exports.BackupTask = BackupTask;
exports.RestoreTask = RestoreTask;
