var Promise = require('es6-promise').Promise;
var fs = require('fs');

exports.readdir = function(path) {
	return new Promise(function(resolve, reject) {
		fs.readdir(path, function(err, files) {
			if (err)
				reject(err);
			else
				resolve(files);
		});
	});
};

exports.rename = function(source, dest) {
	return new Promise(function(resolve, reject) {
		fs.rename(source, dest, function(err) {
			if (err)
				reject(err);
			else
				resolve();
		});
	});
};

exports.lstat = function(dir) {
	return new Promise(function(resolve, reject) {
		fs.lstat(dir, function(err, stat) {
			if (err)
				reject(err);
			else
				resovle(stat);
		});
	});
};
