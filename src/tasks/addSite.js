var Task = require('../task.js');
var fs = require('q-io/fs');
var Q = require('q');
var yaml = require('js-yaml');
var hooks = require('../hooks.js');

function AddSiteTask(siteManager, siteName, branch, options) {
	Task.call(this);
	this.options = options | {};
	this.siteManager = siteManager;
	this.name = 'Add site ' + siteName;
	this.siteName = siteName;
	this.branch = branch;
}

AddSiteTask.prototype = Object.create(Task.prototype);

AddSiteTask.prototype.perform = function*() {
	var manager = this.siteManager;
	var siteName = this.siteName;

	yield this.runNestedQuietly(manager.loadTask(false));

	var sites = yaml.safeLoad(yield fs.read(manager.path + '/sites.yaml'));

	if (siteName in sites)
		throw new Error('The site ' + siteName + ' already exists');

	var sitePath = fs.join(manager._siteRoot, siteName);
	if (yield fs.exists(sitePath))
		throw new Error('The target path ' + sitePath + ' already exists');

	yield Q.async(function*() {
		this.cd(manager._siteRoot);
		var relativeRepoPath = yield fs.relative(manager._siteRoot, manager._repoPath);
		yield this.exec('git clone "' + relativeRepoPath + '" "' + siteName + '" --branch ' + this.branch);

		// Symlink objects to save space in the future
		// (the initial clone created hardlinks, so that won't take long or much space,
		// but subsequent objects would be stored multiple times)
		var gitPath = fs.join(sitePath, '.git');
		var objectsPath = fs.join(gitPath, 'objects');
		var mainObjectsPath = fs.join(manager._repoPath, 'objects');
		yield fs.removeTree(objectsPath);
		yield fs.symbolicLink(objectsPath, yield fs.relative(gitPath, mainObjectsPath), 'directory');
	}).call(this);

	yield Q.async(function*() {
		this.doLog('Initializing backup repository for data directory...');
		var dataPath = fs.join(sitePath, 'data');

		if (!(yield fs.exists(dataPath))) {
			yield fs.makeDirectory(dataPath);
			this.doLog('data directory does not exist, it has been created.');
		}

		var relativeBackupRepoPath = yield fs.relative(dataPath, manager.backupRepoPath);
		this.cd(dataPath);
		yield this.exec('git init');
		yield this.exec('git remote add origin "' + relativeBackupRepoPath + '"');

		// Make sure that the packed-refs directory exists in the main backup repo, because it has to be linked
		var packedRefsPath = fs.join(manager.backupRepoPath, 'packed-refs');
		if (!(yield fs.exists(packedRefsPath))) {
			yield fs.write(packedRefsPath, '');
		}

		// The backup repos share the main backup repo's object db and refs (except HEAD), so that they
		// can commit directly to the main repo and get their version history from it
		var links = { objects: 'directory', refs: 'directory', 'packed-refs': 'file' };
		this.cd(dataPath);
		for (var linkName in links) {
			var type = links[linkName];
			var gitPath = fs.join(dataPath, '.git');
			var linkPath = fs.join(gitPath, linkName);
			var targetPath = fs.join(manager.backupRepoPath, linkName);

			// Remove possibly existing file/directory and replacy with symlink
			if (yield (fs.exists(linkPath)))
				yield fs.removeTree(linkPath);
			yield fs.symbolicLink(linkPath, yield fs.relative(gitPath, targetPath), type);
		}

		this.exec('git checkout -b "' + siteName + '"');
	}).call(this);

	this.doLog('Writing new sites.yaml...');
	sites[siteName] = { };
	yield fs.write(manager.path + '/sites.yaml', yaml.safeDump(sites));

	yield this.runNestedQuietly(manager.loadTask(false));
	var site = manager.getSite(siteName);
	if (!site)
		throw new Error('site has not been loaded');
	yield hooks.call('afterCreate', this, site);
	yield hooks.call('afterCheckout', this, site);
};

module.exports = AddSiteTask;
