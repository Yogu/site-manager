var Q = require('q');

var hookNames = [ 'afterCheckout', 'afterPull', 'beforeBackup', 'afterRestore', 'afterUpgrade',
                  'upgradeFailed' ];

var hooks = {};
for (var i = 0; i < hookNames.length; i++)
	hooks[hookNames[i]] = [];

/**
 * Registers a hook to be called in specific tasks
 * 
 * @param string name the hook name
 * @param function(Site): Task a function that returns a task to be executed
 */
exports.register = function(name, taskBuilder) {
	if (!(name in hooks))
		throw new Error('Unrecognized hook: ' + name);
	
	hooks[name].push(taskBuilder);
};

exports.call = Q.async(function*(name, task, site) {
	if (!(name in hooks))
		throw new Error('Unrecognized hook: ' + name);
	
	var theHooks = hooks[name];
	if (theHooks.length == 0)
		return;
	
	task.doLog('Calling ' + theHooks.length + ' ' + name + ' hooks');
	for (var i = 0; i < theHooks.length; i++) {
		var subTask = theHooks[i](site);
		yield task.runNested(subTask);
	}
});
