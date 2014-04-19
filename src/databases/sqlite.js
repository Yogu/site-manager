var sqlite = require('node-sqlite-purejs');
var Q = require('q');
var fs = require('q-io/fs');

exports.connect = Q.async(function*(options) {
	if (typeof options.path != 'string')
		throw new Error("sqlite database requires path option to be string");
	
	var connection = yield Q.nfcall(sqlite.open, options.path, {});
	
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
			
			sql = sql.replace('?', function(match) {
				if (!params.length)
					throw new Error('too few params specified');
				return "'" + params.pop().toString().replace('\\', '\\\\').replace('\"', '\\\"')
					.replace('\'', '\\\'').replace('\n', '\\n').replace('\r', '\\r') + "'";
			});
			if (params.length)
				throw new Error('too much params specified (' + params.length + ' left');
			var result = yield Q.ninvoke(connection, 'exec', sql);
			yield Q.ninvoke(connection, 'save');
			return result;
		}),
		
		restore: Q.async(function*(path) {
			yield fs.cp(path, options.path);
			// reconnect
			connection = yield Q.nfcall(sqlite.open, options.path, {});
			return;
		}),
		
		dump: function(path) {
			return fs.copy(options.path, path);
		}
	};
});
