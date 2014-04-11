var ShellTask = require('../../src/tasks/shell.js');

describe("ShellTask", function() {
	it("returns the stdout", function(done) {
		var task = new ShellTask('echo "hi"');
		task.start();
		task.then(function(stdout) {
			expect(stdout).toEqual("hi\n");
			done();
		});
	});

	it("specifies command in its name", function() {
		var task = new ShellTask("ls");
		expect(task.name).toBe("exec ls");
	});
	
	it("logs the command, stdout and stderr", function(done) {
		var task = new ShellTask('echo "bad" >&2 ; echo "good"');
		
		task.start();
		task.then(function() {
			expect(task.log).toEqual("stdout: good\nstderr: bad\n");
			done();
		});
	});
	
	it("rejects if exit code is not zero", function(done) {
		var task = new ShellTask('exit 13');
		task.start();
		task.catch(function(error) {
			expect(error.code).toEqual(13);
			done();
		});
	});
	
	it("respects cwd parameter", function(done) {
		var task = new ShellTask('pwd', '/usr/bin');
		task.start();
		task.then(function(stdout) {
			expect(stdout.trim()).toEqual("/usr/bin");
			done();
		});
	});
});
