var Task = require('../task.js');
var fs = require('q-io/fs');
var Q = require('q');
var yaml = require('js-yaml');

function CreateMergeRequestSiteTask(siteManager, siteName, sourceBranch, targetBranch) {
	Task.call(this);
	this.siteManager = siteManager;
	this.sourceBranch = sourceBranch;
	this.targetBranch = targetBranch;
	this.siteName = siteName;
	this.name = 'Create Site ' + siteName + ' (for Merge Request of ' + sourceBranch + ' into ' + targetBranch + ')';
}

CreateMergeRequestSiteTask.prototype = Object.create(Task.prototype);

CreateMergeRequestSiteTask.prototype.perform = function*() {
	var manager = this.siteManager;
	var siteName = this.siteName;

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
