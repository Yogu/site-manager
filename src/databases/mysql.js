var mysql = require('mysql');
var Q = require('q');
var ShellTask = require('../tasks/shell.js');
var fs = require('q-io/fs');

exports.connect = Q.async(function*(options) {
	
	var connection = mysql.createConnection(options);
	yield Q.ninvoke(connection, 'connect');

	return {
		/**
		 * Executes one or multiple SQL statements asynchronously, and resolves the 
		 * result of the last query
		 * 
		 * Not intended to be used with untrusted params.
		 */
		exec: Q.async(function*(sql, params) {
			if (params === undefined)
				params = [];
			if (!(params instanceof Array))
				throw new Error('params must be an array');
			if (typeof sql != 'string')
				throw new Error('sql must be a string');

			return yield Q.ninvoke(connection, 'query', sql, params);
		}),
		
		restore: Q.async(function*(path) {
			// Drop all tables
			yield this.clear();

			// restore backup
			var backup = yield fs.read(path);
			yield Q.ninvoke(connection, 'query',  backup);
		}),
		
		clear: Q.async(function*() {
			var result = yield Q.ninvoke(connection, 'query', "SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS statement " +
				"FROM information_schema.tables " +
				"WHERE table_schema = ?", [ options.database]);
			var sql = "SET FOREIGN_KEY_CHECKS=0" + result.join('\n');

			yield Q.ninvoke(connection, 'query',  sql);
		}),
		
		dump: function*(path) {
			yield ShellTask.exec("mysqldump -u " + ShellTask.escape(options.user) + " " +
				ShellTask.escape("--password=" + options.password) + " " +
				ShellTask.escape("--host=" + options.host) + " " +
				ShellTask.escape(options.database) + " > " + ShellTask.escape(path));
		}
	};
});
