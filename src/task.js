var Promise = require('es6-promise').Promise;

function Task() {
	// capture the callbacks to defer the actual task performance until start() is called
	Promise.call(this, function(resolve, reject) {
		this._resolve = function() {
			this.status = 'done';
			resolve.apply(this, arguments);
		}.bind(this); 
		
		this._reject = function() {
			this.status = 'failed';
			reject.apply(this, arguments);
		}.bind(this);
	}.bind(this));
	
	this.status = 'ready';
};

Task.prototype = Object.create(Promise.prototype);

Task.prototype.start = function() {
	if (this.status != 'ready')
		throw new Error("This task has already been started (status is " + this.status + ")");
	if (!(this.perform instanceof Function))
		throw new Error("Tasks must have a perform() method");
	
	this.status = 'running';
	
	try {
		this.perform(this._resolve, this._reject);
	} catch (e) {
		this._reject(e);
	}
};

Task.prototype.perform = function(resolve, reject) {
	reject("perform() method must be overridden");
};

module.exports = Task;
