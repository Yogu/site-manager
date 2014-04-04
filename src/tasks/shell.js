var Task = require('../task.js');
var exec = require('child_process').exec;

function ShellTask(command, cwd) {
	Task.call(this);
	this.name = "exec " + command + (cwd ? " (in " + cwd + ")" : '');
	this.command = command;
	this.cwd = cwd;
}

ShellTask.prototype = Object.create(Task.prototype);

ShellTask.prototype.perform = function(resolve, reject) {
	var options = {};
	if (this.cwd)
		options.cwd = this.cwd;
	exec(this.command, options, function(error, stdout, stderr) {
		if (stdout)
			this.log("stdout: " + stdout);
		if (stderr)
			this.log("stderr: " + stderr);
		if (error !== null) {
			reject(error);
		} else {
			resolve(stdout);
		}
	}.bind(this));
};

module.exports = ShellTask;