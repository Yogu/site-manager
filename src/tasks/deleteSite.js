var Task = require('../task.js');
var fs = require('q-io/fs');
var Q = require('q');
var yaml = require('js-yaml');
var hooks = require('../hooks.js');

function DeleteSiteTask(siteManager, site) {
	Task.call(this);
	this.siteManager = siteManager;
	this.site = site;
	this.name = 'Delete ' + site.name;
}

DeleteSiteTask.prototype = Object.create(Task.prototype);

DeleteSiteTask.prototype.perform = function*() {
	var manager = this.siteManager;
	var site = this.site;

	yield hooks.call('beforeDelete', this, site);

	this.doLog('Removing ' + site.path + '...');
	yield fs.removeTree(site.path);

	yield hooks.call('deletingSite', this, site);

	this.doLog('Removing site from sites.yaml...');
	var sites = yaml.safeLoad(yield fs.read(manager.path + '/sites.yaml'));
	delete sites[site.name];
	yield fs.write(manager.path + '/sites.yaml', yaml.safeDump(sites));
	yield this.runNestedQuietly(manager.loadTask(false));

	yield hooks.call('afterDelete', this, site);
};

module.exports = DeleteSiteTask;
