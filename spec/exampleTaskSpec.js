var ExampleTask = require('../src/tasks/example.js');

describe("ExampleTask", function() {
	it("should add numbers", function(done) {
		var task = new ExampleTask([1,2,3]);
		task.then(function(sum) {
			expect(sum).toEqual(6);
			done();
		});
		task.start();
	});

	it("should fail if sum is zero", function(done) {
		var task = new ExampleTask([1, 2, -3]);
		task.catch(function() {
			done();
		});
		task.start();
	});
});
