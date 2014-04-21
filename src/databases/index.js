var sqlite = require('./sqlite.js');
var mysql = require('./mysql.js');
var Q = require('q');

/**
 * Connects asynchronously to the specified data base
 * 
 * If options.type is unset, resolves with null
 */
exports.connect = function(options) {
	if (typeof options != 'object')
		return Q.reject("options must be an object");
	if (!options.type)
		return Q.fulfill(null);
	
	switch (options.type) {
	case 'sqlite':
		return sqlite.connect(options);
	case 'mysql':
		return mysql.connect(options);
	default:
		return Q.reject(new Error('Unsupported data base type: ' + options.type));
	}
};
