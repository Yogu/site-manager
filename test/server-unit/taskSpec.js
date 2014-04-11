var Task = require('../../src/task.js');

describe("Task", function(done) {
	it("has unique id", function() {
		var task1 = new Task();
		var task2 = new Task();
		expect(task1.id).not.toEqual(task2.id);
	});
	
	it("has unique name by default", function() {
		var task1 = new Task();
		var task2 = new Task();
		expect(task1.name).not.toEqual(task2.name);
	});
	
	it("accepts name as constructor argument", function() {
		var task = new Task("the name");
		expect(task.name).toEqual("the name");
	});
	
	it("accepts callback as constructor argument", function(done) {
		var task = new Task(function(resolve) { resolve(123); });
		task.start();
		task.then(function(result) {
			expect(result).toBe(123);
			done();
		}, function(err) { this.fail(err); done(); }.bind(this));
	});
	
	it("accepts both name and callback as constructor argument", function(done) {
		var task = new Task("the name", function(resolve) { resolve(123); });
		expect(task.name).toEqual("the name");
		task.start();
		task.then(function(result) {
			expect(result).toBe(123);
			done();
		}, function(err) { this.fail(err); done(); }.bind(this));
	});
	
	it("is ready after creation", function() {
		var task = new Task();
		expect(task.status).toEqual("ready");
	});
	
	it("fails without setting perform()", function(done) {
		var task = new Task();
		task.start();
		task.catch(function() {
			expect(task.status).toEqual("failed");
			done();
		});
	});
	
	it("is running after calling start()", function() {
		var task = new Task();
		task.perform = function(res) { };
		
		task.start();
		
		expect(task.status).toEqual("running");
	});
	
	it("does not run before start() is called", function() {
		var task = new Task();
		var performed = false;
		task.perform = function() { performed = true; };
		
		expect(performed).toEqual(false);
	});
	
	it("does not allow to call start() twice", function() {
		var task = new Task();
		task.perform = function(res) { };		
		task.start();
		
		expect(function() {
			task.start();
		}).toThrow();

		expect(task.status).toEqual("running");
	});
	
	it("is done when perform calls resolve()", function(done) {
		var task = new Task();
		task.perform = function(res) { res(); };
		task.start();
		
		task.then(function() {
			expect(task.status).toEqual("done");
			done();
		});
	});
	
	it("calls perform() when start() is called", function(done) {
		var task = new Task();
		var performed = false;
		task.perform = function(res) { performed = true; res(); };
		task.start();
		
		task.then(function() {
			expect(performed).toBe(true);
			done();
		});
	});
	
	it("is failed when perform calls reject()", function(done) {
		var task = new Task();
		task.perform = function(resolve, reject) { reject("reason"); };
		task.start();
		
		task.catch(function(reason) {
			expect(reason).toEqual("reason");
			expect(task.status).toEqual("failed");
			done();
		});
	});
	
	it("fails if error is throwin in perform()", function(done) {
		var task = new Task();
		task.perform = function(resolve, reject) { throw "the error"; };
		task.start();
		
		task.catch(function(error) {
			expect(error).toEqual("the error");
			done();
		});
	});
	
	it("emits event when doLog() is called", function(done) {
		var task = new Task();
		task.perform = function(resolve, reject) { this.doLog("The message\nsecond line"); resolve(); };
		var logEmits = 0;
		task.on("log", function(message) {
			expect(logEmits).toBeLessThan(2);
			if (logEmits == 0)
				expect(message).toBe("The message");
			else
				expect(message).toBe('second line');
			logEmits++;
		});
		task.start();
		task.then(function() {
			expect(logEmits).toBe(2);
			done();
		});
	});
	
	it("collects logs called by doLog()", function(done) {
		var task = new Task();
		task.perform = function(resolve, reject) { this.doLog("first"); this.doLog("second"); resolve(); };
		
		task.start();
		task.then(function() {
			expect(task.log).toBe("first\nsecond\n");
			done();
		});
	});
	
	it("can run nested tasks", function(done) {
		var parent = new Task();
		parent.name = 'parent';
		var goodChild = new Task();
		goodChild.name = 'good-child';
		var badChild = new Task();
		badChild.name = 'bad-child';
		parent.perform = function(resolve) {
			this.doLog('before');
			this.runNested(goodChild).then(function(argument) {
				expect(argument).toBe('good');
				this.doLog('between');
				return this.runNested(badChild);
			}.bind(this)).catch(function(argument) {
				expect(argument).toBe('bad');
				this.doLog('after');
				resolve();
			}.bind(this));
		};
		goodChild.perform = function(resolve) {
			this.doLog('good child');
			resolve('good');
		};
		badChild.perform = function(resolve, reject) {
			this.doLog('bad child');
			reject('bad');
		};
		var log = [];
		
		parent.start();
		parent.then(function() {
			expect(parent.log).toEqual(['before',
			                    'Starting nested task good-child',
			                    '  good child',
			                    'Nested task good-child succeeded',
			                    'between',
			                    'Starting nested task bad-child',
			                    '  bad child',
			                    'Nested task bad-child failed: bad',
			                    'after', ''].join("\n"));
			done();
		}, function(e) { this.fail(e); }.bind(this));
	});
	
	it("provides shorthand to execute shell scripts", function(done) {
		var task = new Task();
		task.perform = function(resolve, reject) {
			this.cd('/usr/bin');
			this.exec('pwd').then(function(result) {
				expect(result.trim()).toBe('/usr/bin');
				resolve();
			});
		};
		task.start();
		task.then(done);
	});
});
