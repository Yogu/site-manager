var EventEmitter = require('events').EventEmitter;
var SiteManager = require('./siteManager.js');

function Controller(dir) {
	EventEmitter.call(this);
	this.dir = dir;
	this.manager = new SiteManager(dir);
	this._initialLoad = this.manager.loadTask();
	this.manager.schedule(this._initialLoad);
	
	this.manager.on('siteAdded', function(newSite) {
		this._initTaskContextHandlers(newSite);
		this._initSiteHandlers(newSite);
	}.bind(this));
	
	this.manager.on('load', function() {
		this._siteMap = {};
		this.manager.sites.forEach(function(site) { this._siteMap[site.name] = site; }.bind(this));
	}.bind(this));
	
	this._initTaskContextHandlers(this.manager);
}

Controller.prototype = Object.create(EventEmitter.prototype);

Controller.prototype.getSites = function() {
	return this._initialLoad.catch(function(){}).then(function() {
		return this.manager.sites;
	}.bind(this));
};

Controller.prototype.getSite = function(siteName) {
	return this.getSites().then(function() {
		if (siteName in this._siteMap)
			return this._siteMap[siteName];
		throw new Error("There is no such site");
	}.bind(this));
};

Controller.prototype._initSiteHandlers = function(site) {
	site.on('load', function() {
		this.emit('site:load', site);
	}.bind(this));
};

Controller.prototype._initTaskContextHandlers = function(taskContext) {
	taskContext.on('schedule', function(task) {
		this.emit('task:schedule', task);
		
		task.on('log', function(message) {
			this.emit('task:log', task, message);
		}.bind(this));

		task.on('status', function() {
			this.emit('task:status', task);
		}.bind(this));
	}.bind(this));
};

Controller.prototype.reload = function() {
	this.manager.schedule(this.manager.loadTask());
};

module.exports = Controller;
