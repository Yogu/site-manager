var server = require('../src/server.js');

describe("server", function() {
	it("boots without errors", function() {
		server.start(12345, __dirname).close();
	});
});
