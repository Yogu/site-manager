var mysql = require('mysql');
var Q = require('q');
var ShellTask = require('../tasks/shell.js');
var fs = require('q-io/fs');

exports.connect = Q.async(function*(options) {
	options = Object.create(options);
	options.multipleStatements = true;
	
	var connection = mysql.createConnection(options);
	yield Q.ninvoke(connection, 'connect');

	return {
		/**
		 * Executes one or multiple SQL statements asynchronously, and resolves the 
		 * result of the last query
		 * 
		 * Not intended to be used with untrusted params.
		 */
		exec: function(sql, params) {
			if (params === undefined)
				params = [];
			if (!(params instanceof Array))
				throw new Error('params must be an array');
			if (typeof sql != 'string')
				throw new Error('sql must be a string');

			// manually create the promise because connection.query() sometimes returns two values,
			// and then the promise would resolve in an array.
			var deferred = Q.defer();
			Q.ninvoke(connection, 'query', sql, params, function(err, result) {
				if (err)
					deferred.reject(err);
				else
					deferred.resolve(result);
			});
			
			return deferred.promise;
		},
		
		restore: Q.async(function*(path) {
			// Drop all tables
			yield this.clear();

			// restore backup
			var backup = yield fs.read(path);
			yield Q.ninvoke(connection, 'query',  backup);
		}),
		
		clear: Q.async(function*() {
			var result = yield this.exec("SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS statement " +
				"FROM information_schema.tables " +
				"WHERE table_schema = ?", [ options.database]);
			var sql = "SET FOREIGN_KEY_CHECKS=0; " + result.map(function(row) { return row.statement;}).join('\n');

			yield this.exec(sql);
		}),
		
		dump: function*(path) {
			yield ShellTask.exec("mysqldump -u " + ShellTask.escape(options.user) + " " +
				ShellTask.escape("--password=" + options.password) + " " +
				ShellTask.escape("--host=" + options.host) + " " +
				ShellTask.escape(options.database) + " > " + ShellTask.escape(path));
		},
		
		snippets: {
			now: "NOW()"
		}
	};
});
