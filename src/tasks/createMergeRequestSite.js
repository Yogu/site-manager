var Task = require('../task.js');
var fs = require('q-io/fs');
var Q = require('q');
var yaml = require('js-yaml');

function CreateMergeRequestSiteTask(siteManager, sourceBranch, targetBranch) {
	Task.call(this);
	this.siteManager = siteManager;
	this.sourceBranch = sourceBranch;
	this.targetBranch = targetBranch;
	this.name = 'Create Site for Merge Request from ' + sourceBranch + ' into ' + targetBranch;
}

CreateMergeRequestSiteTask.prototype = Object.create(Task.prototype);

CreateMergeRequestSiteTask.prototype.perform = function*() {
	var manager = this.siteManager;
	var siteName = 'mr-' + this.sourceBranch;

	if (!(this.targetBranch in manager.siteBranchMapping)) {
		throw new Error('siteBranchMapping config does not contain the site for branch ' + this.targetBranch);
	}
	var targetSiteName = manager.siteBranchMapping[this.targetBranch];

	var site = yield this.runNested(manager.addSiteTask(siteName, this.targetBranch));

	this.doLog('Configuring site: isMergeRequest: true, sourceBranch: ' + this.sourceBranch +
		', stagingOf: ' + targetSiteName);
	var sites = yaml.safeLoad(yield fs.read(manager.path + '/sites.yaml'));
	sites[site.name].isMergeRequestSite = true;
	sites[site.name].sourceBranch = this.sourceBranch;
	sites[site.name].stagingOf = targetSiteName;
	yield fs.write(manager.path + '/sites.yaml', yaml.safeDump(sites));

	yield this.runNested(manager.loadTask());
	var upgradeTask = site.upgradeTask();
	site.schedule(upgradeTask);
	yield upgradeTask;
};

module.exports = CreateMergeRequestSiteTask;
