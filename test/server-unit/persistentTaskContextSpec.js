var PersistentTaskContext = require('../../src/persistentTaskContext.js');
var Task = require('../../src/task.js');
var resources = require('./utils/resources.js');
var Promise = require('es6-promise').Promise;

describe('PersistentTaskContext', function() {
	it("does not archive anything until path is set", function(done) {
		resources.withEmptyDir(function(path) {
			var context = new PersistentTaskContext();
			var task1 = new Task('deferred-archiving', function(resolve) { resolve(); });
			context.schedule(task1);
			
			new Promise(function(resolve) { setTimeout(resolve, 0); }) // let it try to save
				.then(function() {
					return context.count()
				})
				.then(function(count) {
					expect(count).toBe(1);
					return context.getTasks(0, 10);
				})
				.then(function(tasks) {
					expect(tasks.length).toBe(1);
					expect(tasks[0]).toBe(task1);
					
					// now give it the path
					context.setTaskArchivePath(path);
					// give it time to save
					return new Promise(function(resolve) { setTimeout(resolve, 100); });
				})
				.then(function() {
					var context = new PersistentTaskContext(path);
					return context.count();
				})
				.then(function(count) {
					expect(count).toBe(1);
				})
				.catch(function(err) { this.fail(err); }.bind(this))
				.then(done);
		}.bind(this));
	});
	
	it("creates log path if not existing", function(done) {
		resources.withEmptyDir(function(path) {
			var context = new PersistentTaskContext(path + '/deeply/nested');
			var task1 = new Task(function(resolve) { resolve(); });
			context.schedule(task1);
			
			task1
			.then(function() {
				return new Promise(function(resolve) { setTimeout(resolve, 100); }) // time to save
			})
			.then(function() {
				return context.count()
			})
			.then(function(count) {
				expect(count).toBe(1);
			})
			.catch(function(err) { this.fail(err); }.bind(this))
			.then(done);
		}.bind(this));
	});

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
	
	it("collects time information", function(done) {
		var context = new PersistentTaskContext();
		var task = new Task(function(resolve) { resolve(); });
		context.schedule(task);
		setTimeout(function() {
			expect(task.startTime.constructor).toBe(Date);
			expect(task.endTime.constructor).toBe(Date);
			expect(task.scheduleTime.constructor).toBe(Date);
			expect(typeof task.duration).toBe('number');
			done();
		}, 0);
	});
});
