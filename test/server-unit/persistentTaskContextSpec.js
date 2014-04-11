var PersistentTaskContext = require('../../src/persistentTaskContext.js');
var Task = require('../../src/task.js');
var resources = require('./utils/resources.js');
var Promise = require('es6-promise').Promise;

describe('PersistentTaskContext', function() {
	it("lists active tasks", function(done) {
		resources.withEmptyDir(function(path) {
			var context = new PersistentTaskContext(path);
			var task1 = new Task(function(resolve) {});
			var task2 = new Task(function(resolve) {});
			context.schedule(task1);
			context.schedule(task2);
			context.count()
				.then(function(count) {
					expect(count).toBe(2);
				})
				.then(function() { return context.getTasks(0, 10); })
				.then(function(tasks) {
					expect(tasks.length).toBe(2);
					// newest first
					expect(tasks[0]).toBe(task2);
					expect(tasks[1]).toBe(task1);
				})
				.then(function() { return context.getTasks(1, 10); })
				.then(function(tasks) {
					expect(tasks.length).toBe(1);
					expect(tasks[0]).toBe(task1);
				})
				.then(function() { return context.getTasks(0, 1); })
				.then(function(tasks) {
					expect(tasks.length).toBe(1);
					expect(tasks[0]).toBe(task2);
				})
				.catch(function(err) { console.log(err); this.fail(err); }.bind(this))
				.then(done);
		}.bind(this));
	});
	
	it("saves finished tasks to disk", function(done) {
		resources.withEmptyDir(function(path) {
			var context = new PersistentTaskContext(path);
			var task1 = new Task('task1', function(resolve) { this.doLog("good"); resolve(); });
			var task2 = new Task('task2', function(resolve, reject) { this.doLog("bad"); reject(); });
			var task3 = new Task('task3', function(resolve) { resolve(); });
			var task4 = new Task('task4', function(resolve) { });
			context.schedule(task1);
			context.schedule(task2);
			task2.catch(function() {
				// time to save the task
				return new Promise(function(resolve) { setTimeout(resolve, 100); });
			}).then(function() {
				// simulate restart by recreating the context
				context = new PersistentTaskContext(path);
			})
			.then(function() { return context.count(); })
			.then(function(count) {
				expect(count).toBe(2);
			})
			.then(function() { return context.getTasks(0, 10); })
			.then(function(tasks) {
				expect(tasks.length).toBe(2);
				// newest first
				expect(tasks[0].id).toBe(task2.id);
				expect(tasks[0].name).toBe(task2.name);
				expect(tasks[0].log).toBe("bad\n");
				expect(tasks[0].status).toBe("failed");

				expect(tasks[1].id).toBe(task1.id);
				expect(tasks[1].name).toBe(task1.name);
				expect(tasks[1].log).toBe("good\n");
				expect(tasks[1].status).toBe("done");
				
				context.schedule(task3);
				context.schedule(task4);
				return task3;
			})
			.then(function() {
				// time to save task3 and begin task4
				return new Promise(function(resolve) { setTimeout(resolve, 100); });
			})
			.then(function() { return context.count(); })
			.then(function(count) {
				expect(count).toBe(4);
			})
			.then(function() { return context.getTasks(0, 10); })
			.then(function(tasks) {
				expect(tasks.length).toBe(4);
				expect(tasks[0].id).toBe(task4.id);
				expect(tasks[1].id).toBe(task3.id);
				expect(tasks[2].id).toBe(task2.id);
				expect(tasks[3].id).toBe(task1.id);
			})
			.catch(function(err) { this.fail(err); }.bind(this))
			.then(done);
		}.bind(this));
	});
});
