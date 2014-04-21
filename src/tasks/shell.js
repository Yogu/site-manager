var Task = require('../task.js');
var Q = require('q');
var exec = Q.nfbind(require('child_process').exec);

function ShellTask(command, cwd) {
	Task.call(this);
	this.name = "exec " + command + (cwd ? " (in " + cwd + ")" : '');
	this.command = command;
	this.cwd = cwd;
}

ShellTask.prototype = Object.create(Task.prototype);

ShellTask.prototype.perform = function*() {
	var options = {};
	if (this.cwd)
		options.cwd = this.cwd;
	options.maxBuffer = 1024 * 1024 * 10;
	
	var result = yield exec(this.command, options);
	result = { stdout: result[0], stderr: result[1] };

	if (result.stdout)
		this.doLog(result.stdout);
	if (result.stderr)
		this.doLog(result.stderr);
	
	return result;
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
