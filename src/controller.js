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
	}.bind(this));
	this._initTaskContextHandlers(this.manager);	
}

Controller.prototype = Object.create(EventEmitter.prototype);

Controller.prototype.getSites = function() {
	return this._initialLoad.catch(function(){}).then(function() {
		return this.manager.sites;
	}.bind(this));
};

Controller.prototype._initTaskContextHandlers = function(taskContext) {
	taskContext.on('schedule', function(task) {
		this.emit('task:schedule', task);
		
		task.on('log', function(message) {
			this.emit('task:log', task.id, message);
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
