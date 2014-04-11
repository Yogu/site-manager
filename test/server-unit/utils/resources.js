var fs = require("fs");
var walk = require('walk');
var Path = require('path');
var rmRecursively = require('rimraf');
var ncp = require('ncp');
var Promise = require('es6-promise').Promise;

var resourceSourcePath = Path.resolve(__dirname, '../resources');
var workdirPath = Path.resolve(__dirname, '../workdir');

// clear workdir at the beginning of the tests, so that all files created
// during the tests are accessible after it
var workdirCleared = new Promise(function(resolve) {
	fs.exists(workdirPath, function(exists) {
		if (!exists)
			return resolve();
		rmRecursively(workdirPath, function(error) {
			if(error)
				return console.error(error.stack);
			resolve();
		});
	});
}).then(function() {
	return new Promise(function(resolve) {
		fs.mkdir(workdirPath, function(err) { if (err) throw err; resolve(); });
	});
});

var workdirIndex = 1;

function getNewWorkdirPath() {
	return workdirPath + '/' + workdirIndex++;
}

function renameDotGit(path, callback) {
	var walker = walk.walk(path, { followLinks: false });
	walker.on('directory', function(path, stat, next) {
		if (stat.name == 'dot_git')
			fs.rename(Path.resolve(path, stat.name), Path.resolve(path, '.git'), function(err) {
				if (err)
					return callback(err);
				next();
			});
		else
			next();
	});
	walker.on('end', function() { callback(null); });
}

exports.use = function(callback) {
	workdirCleared.then(function() {
		var path = getNewWorkdirPath();
		ncp(resourceSourcePath, path, function(error) {
			if (error)
				throw error;
			
			renameDotGit(path, function(error) {
				if (error)
					throw error;
				
				callback(path);
			});
		}.bind(this));
	}.bind(this));
};

exports.withEmptyDir = function(callback) {
	workdirCleared.then(function() {
		var path = getNewWorkdirPath();
		fs.mkdir(path, function(err) { if (err) throw err; callback(path); });
	});
};
