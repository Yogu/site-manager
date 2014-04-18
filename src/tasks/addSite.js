var Task = require('../task.js');
var fs = require('q-io/fs');
var q = require('q');
var yaml = require('js-yaml');

function AddSiteTask(siteManager, siteName, branch) {
	Task.call(this);
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

	this.cd(manager._siteRoot);
	var relativeRepoPath = yield fs.relative(manager._siteRoot, manager._repoPath);
	yield this.exec('git clone "' + relativeRepoPath + '" "' + siteName + '" --branch ' + this.branch);
	
	// Symlink objects to save space in the future
	// (the initial clone created hardlinks, so that won't take long or much space,
	// but subsequent objects would be stored multiple times)
	yield fs.removeTree(fs.join(sitePath, '.git/objects'));
	yield fs.symbolicLink(
			fs.join(sitePath, '.git/objects'),
			fs.join('../..' /* leave of site-name/.git */, relativeRepoPath, 'objects'),
			'directory');
	
	this.doLog('Writing new sites.yaml...');
	sites[siteName] = { };
	yield fs.write(manager.path + '/sites.yaml', yaml.safeDump(sites));
	
	yield this.runNestedQuietly(manager.loadTask(false));
};

module.exports = AddSiteTask;
