var fs = require("fs");
var walk = require('walk');
var Path = require('path');
var rmRecursively = require('rimraf');
var ncp = require('ncp');

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
	var resourceSourcePath = Path.resolve(__dirname, '../resources');
	var resourceDestPath = Path.resolve(__dirname, '../workdir');
	rmRecursively(resourceDestPath, function(error) {
		if (error)
			throw error;
		ncp(resourceSourcePath, resourceDestPath, function(error) {
			if (error)
				throw error;
			
			renameDotGit(resourceDestPath, function(error) {
				if (error)
					throw error;
				
				callback(resourceDestPath);
			});
		}.bind(this));
	}.bind(this));
};
