var Task = require('../task.js');

function ExampleTask(input) {
	Task.call(this);
	this.input = input;
}

ExampleTask.prototype = Object.create(Task.prototype);

ExampleTask.prototype.perform = function(resolve, reject) {
	var sum = 0;
	for (var i = 0; i < this.input.length; i++) {
		//this.log(this.input[i]);
		sum += this.input[i];
	}
	
	this.output = sum;

	if (this.output == 0)
		reject("Sum is zero");
	else
		resolve(sum);
};

module.exports = ExampleTask;