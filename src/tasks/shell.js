var Task = require('../task.js');
var exec = require('child-process-promise').exec;
var Q = require('q');

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
	
	var result = yield exec(this.command, options);
	
	if (result.stdout)
		this.doLog(result.stdout);
	if (result.stderr)
		this.doLog(result.stderr);
	
	return { stdout: result.stdout, stderr: result.stderr };
};

module.exports = ShellTask;
