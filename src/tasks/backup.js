var Task = require('../task.js');
var fs = require('q-io/fs');
var ShellTask = require('./shell.js');
var Q = require('q');
var hooks = require('../hooks.js');
var yaml = require('js-yaml');
require('colors');

/**
  * Makes a backup of this site
	*/
function BackupTask(site, message, options) {
	Task.call(this);
	this.site = site;
	this.name = 'Backup (' + message + ')';
	this.message = message;
	this.options = options || {};
}

BackupTask.prototype = Object.create(Task.prototype);

BackupTask.prototype.perform = function*() {
	var site = this.site;
	var dataPath = fs.join(site.path, 'data');

	if (!(yield fs.exists(dataPath + '/.git')))
		yield this.runNested(new InitDataDirectoryTask(site));
	yield hooks.call('beforeBackup', this, site);

	// store info
	this.doLog('Writing backup.yaml...');
	var info = {
		revision: site.revision
	};
	yield fs.write(dataPath + '/backup.yaml', yaml.safeDump(info));

	this.doLog('Committing backup...');
	this.cd(dataPath);
	yield this.exec('git add -A');
	yield this.exec('git commit --allow-empty -m ' + ShellTask.escape(this.message));
	yield pushIfRemoteExists(this, dataPath, "refs/heads/" + site.name);

	var revision = (yield this.execQuietly("git rev-parse HEAD")).stdout.trim();
	this.doLog('Backup succeeded'.green);
	this.doLog('backup id: ' + revision);

	yield this.runNestedQuietly(site.loadTask());

	site.emit('backup');

	return revision;
};

/**
 * Restores a backup
 * @param revision the revision of the backup to restore
 * @option backup set to false to skip the backup before restore
 */
function RestoreTask(site, revision, options) {
	Task.call(this);
	this.site = site;
	this.name = 'Restore backup ' + revision;
	this.revision = revision;
	this.options = options || {};
}

RestoreTask.prototype = Object.create(Task.prototype);

RestoreTask.prototype.perform = function*() {
	var site = this.site;
	var dataPath = fs.join(site.path, 'data');

	if (!(yield fs.exists(dataPath + '/.git')))
		yield this.runNested(new InitDataDirectoryTask(site));
	this.cd(dataPath);

	// To be safe, backup first
	if (this.options.backup !== false) {
		yield this.runNested(new BackupTask(site, 'pre-restore ' + this.revision));
	} else {
		this.doLog('Skipping pre-restore backup');
	}

	// Add a tag so that the old revision can be reached (version-sort lists test.10 after test.9)
	var lastTag = (yield this.execQuietly('git tag -l "' + site.name + '.*" | sort --version-sort | tail -n 1')).stdout.trim();
	var lastTagNumber = 0;
	if (lastTag) {
		var lastTagNumber = parseInt(lastTag.substr(lastTag.indexOf('.') + 1));
		if (isNaN(lastTagNumber))
			lastTagNumber = 0;
	}
	var tagName = site.name + '.' + (lastTagNumber + 1);
	yield this.execQuietly('git tag ' + tagName);
	yield pushIfRemoteExists(this, dataPath, "refs/tags/" + tagName);

	this.doLog('Restoring data directory...');
	yield this.exec('git reset --hard ' + ShellTask.escape(this.revision));

	this.doLog('Restoring repository...');
	var info = yaml.safeLoad(yield fs.read(dataPath + '/backup.yaml'))
	this.cd(site.path);
	this.exec('git reset --hard ' + ShellTask.escape(info.revision));

	yield hooks.call('afterRestore', this, site);
	yield hooks.call('afterCheckout', this, site);

	this.doLog('Backup restored'.green);

	yield this.runNestedQuietly(site.loadTask());

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
	// switch to the correct branch, but leave that branch empty (do not derive from master)
	yield this.exec('git symbolic-ref HEAD ' + ShellTask.escape("refs/heads/" + site.name));
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

	var currentBackupRevision = yield exports.getCurrentBackupRevision(site);
	if (!currentBackupRevision)
		return [];

	var result = yield ShellTask.exec('git log --tags="' + site.name + '.*" --graph ' +
			'--pretty=format:"%x09%H%x09%at%x09%P%x09%s" ' + site.name /* match the branch */,
			site.path + '/data');
	return result.stdout.split('\n').map(function(line) {
		var parts = line.split(/\t/);
		if (parts.length <= 1) {
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
			prefix: parts[0],
			revision: parts[1],
			time: new Date(parts[2] * 1000),
			parentRevision: parts[3],
			message: parts[4],
			isCurrent: parts[1] == currentBackupRevision
		};
	})
	.filter(function(v) { return v; }); // remove null entries
});

exports.getCurrentBackupRevision = Q.async(function*(site) {
	try {
		var result = yield ShellTask.exec('git rev-parse ' + ShellTask.escape('refs/heads/' + site.name),
				site.path + '/data');
		return result.stdout.trim();
	} catch(err) {
		if (typeof err == 'object' && err.code == 128)
			return null; // the branch does not exist (e.g. unborn)
		throw err;
	}
});

exports.getBackup = Q.async(function*(site, revision) {
	if (!(yield fs.exists(site.path + '/data/.git')))
		return []; // no data, so no backups

	var dataPath = site.path + '/data';

	var result = yield ShellTask.exec('git log -n 1 ' +
			'--pretty=format:"%x09%H%x09%at%x09%P%x09%s" ' + ShellTask.escape(revision),
			dataPath);
	var lines = result.stdout.split('\n').filter(function(line) { return line.trim(); });
	if (!lines.length)
		return null; // not found

	var parts = lines[0].split(/\t/);
	var backup = {
		revision: parts[1],
		time: new Date(parts[2] * 1000),
		parentRevision: parts[3],
		message: parts[4]
	};

	result = yield ShellTask.exec("git show " + ShellTask.escape(revision + ':backup.yaml'), dataPath);
	var info = yaml.safeLoad(result.stdout);
	backup.siteRevision = info.revision;

	return backup;
});

var pushIfRemoteExists = Q.async(function*(task, path, committish) {
	// force push because when restoring, the branch is reset
	task.exec("if [ `git remote | wc -l` -gt 0 ] ; then git push origin -f " + committish + ":" + committish + " ; fi");

});

exports.BackupTask = BackupTask;
exports.RestoreTask = RestoreTask;
