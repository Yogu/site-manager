var EventEmitter = require('events').EventEmitter;
var SiteManager = require('./siteManager.js');

function Controller(dir) {
	EventEmitter.call(this);
	this.dir = dir;
	this.manager = new SiteManager(dir);
	this._initialLoad = this.manager.loadTask();
	this.manager.schedule(this._initialLoad);
}

Controller.prototype = Object.create(EventEmitter.prototype);

Controller.prototype.getSites = function() {
	return this._initialLoad.catch(function(){}).then(function() {
		console.log('load');
		return this.manager.sites;
	}.bind(this));
};

module.exports = Controller;
