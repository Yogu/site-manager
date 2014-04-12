var Server = require('../../src/server.js');
var resources = require('./utils/resources.js');

describe("server", function() {
	it("boots without errors", function(done) {
		resources.use(function(path) {
			try {
				var server = Server.start(12345, path + '/site-collection');
				server.close();
			} catch (e) {
				this.fail(e);
			}
			done();
		}.bind(this));
	});
});
