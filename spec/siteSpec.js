var Site = require('../src/site.js');
var path = require('path');
var resources = require('./utils/resources.js');

var resourcesPath = path.resolve(__dirname, 'resources');

describe("Site", function() {
	it("can load", function(done) {
		resources.use(function(resourcesPath) {
			var site = new Site("test", path.resolve(resourcesPath, 'site-collection/sites/test'));
			var task = site.loadTask();
			// task.on('log', console.log.bind(console)); // for debugging
			site.schedule(task);
			task.then(function() {
				expect(site.isClean).toBe(true);
				expect(site.revision).toBe('bb453f7185d777791cdf5c05ee7ff2efe31b7bba');
				expect(site.branch).toBe('master');
				expect(site.aheadBy).toBe(0);
				expect(site.behindBy).toBe(1);
				done();
			});
		});
	}, 5000);
});
