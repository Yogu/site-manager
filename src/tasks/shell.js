var Task = require('../task.js');
var Q = require('q');
var exec = require('child_process').exec;

function ShellTask(command, cwd) {
	Task.call(this);
	this.name = "exec " + command + (cwd ? " (in " + cwd + ")" : '');
	this.command = command;
	this.cwd = cwd;
}

ShellTask.prototype = Object.create(Task.prototype);

ShellTask.prototype.perform = function() {
	var options = {};
	if (this.cwd)
		options.cwd = this.cwd;
	options.maxBuffer = 1024 * 1024 * 10;
	
	var deferred = Q.defer();
	
	exec(this.command, options, function(error, stdout, stderr) {
		result = { stdout: stdout, stderr: stderr };

		if (stdout)
			this.doLog(stdout);
		if (stderr)
			this.doLog(stderr);
		
		if (error)
			deferred.reject(error);
		else
			deferred.resolve(result);
	}.bind(this));
	
	return deferred.promise;
};

ShellTask.escape = function(cmd) {
	return '"'+cmd.replace(/(["'$`\\])/g,'\\$1')+'"';
};

ShellTask.exec = function(cmd, cwd) {
	var task = new ShellTask(cmd, cwd);
	task.start();
	return task;
};

module.exports = ShellTask;
