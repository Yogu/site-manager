var TaskContext = require('../src/task-context.js');
var Task = require('../src/task.js');

describe("TaskContext", function() {
	it("is idle after creation", function() {
		var context = new TaskContext();
		expect(context.isBusy).toBe(false);
	});
	
	it("runs task directly if not busy", function(done) {
		var context = new TaskContext();
		var task = new Task();
		var isPerformed = false;
		var isRunEmitted = false;
		task.perform = function(resolve) { isPerformed = true; resolve(); };
		context.on("run", function() {
			isRunEmitted = true;
		});
		context.on("done", function() {
			expect(isPerformed).toBe(true);
			expect(isRunEmitted).toBe(true);
			done();
		});
		
		context.schedule(task);
	});
	
	it("runs second task when first task is done", function(done) {
		var context = new TaskContext();
		var task1 = new Task();
		var task2 = new Task();
		var resolveTask1;;
		var task1Performed = false;
		var task2Performed = false;
		var runEmitTimes = 0;
		var doneEmitTimes = 1;
		task1.perform = function(resolve) { task1Performed = true; resolveTask1 = resolve; };
		task2.perform = function(resolve) { task2Performed = true; resolve(); };
		context.on("run", function() { runEmitTimes++; });
		context.on("done", function() { doneEmitTimes++; });
		
		context.schedule(task1);
		context.schedule(task2);
		
		expect(task1Performed).toBe(true);
		expect(task2Performed).toBe(false);
		
		resolveTask1();
		
		task2.then(function() {
			expect(task2Performed).toBe(true);
			expect(runEmitTimes).toEqual(2);
			expect(doneEmitTimes).toEqual(2);
			done();
		});
	});
	
	it("emits the status event", function(done) {
		var context = new TaskContext();
		var task = new Task();
		task.perform = function(resolve) { resolve(); };
		var statusEmitIndex = 0;
		context.on("status", function() {
			if (statusEmitIndex == 0) {
				expect(context.isBusy).toBe(true);
				statusEmitIndex++;
			} else if (statusEmitIndex == 1) {
				expect(context.isBusy).toBe(false);
				done();
			}
		});
		
		context.schedule(task);
	});
});
