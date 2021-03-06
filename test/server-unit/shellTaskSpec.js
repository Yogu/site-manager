var ShellTask = require('../../src/tasks/shell.js');

describe("ShellTask", function() {
	var fail = this.fail;
	
	it("returns stdout and stderr", function(done) {
		var task = new ShellTask('echo "hi"; echo "ho" >&2');
		task.start();
		task.then(function(result) {
			expect(result).toEqual({stdout: "hi\n", stderr: "ho\n"});
		}).catch(function(e) { fail(e); }).then(done);
	});

	it("specifies command in its name", function() {
		var task = new ShellTask("ls");
		expect(task.name).toBe("exec ls");
	});
	
	it("logs the command, stdout and stderr", function(done) {
		var task = new ShellTask('echo "bad" >&2 ; echo "good"');
		
		task.start();
		task.then(function() {
			expect(task.plainLog).toEqual("good\nbad\n");
		}).catch(function(e) { fail(e); }).then(done);
	});
	
	it("rejects if exit code is not zero", function(done) {
		var task = new ShellTask('exit 13');
		task.start();
		task.catch(function(error) {
			expect(error.code).toEqual(13);
			done();
		});
	});
	
	it("logs stdout and stderr when exit code is not zero", function(done) {
		var task = new ShellTask('echo "bad" >&2 ; echo "good"; exit 13');
		
		task.start();
		task.catch(function() {
			expect(task.plainLog).toContain("good\nbad\n");
			done();
		});
	});
	
	it("respects cwd parameter", function(done) {
		var task = new ShellTask('pwd', '/usr/bin');
		task.start();
		task.then(function(result) {
			expect(result.stdout.trim()).toEqual("/usr/bin");
		}).catch(function(e) { fail(e); }).then(done);
	});
});
