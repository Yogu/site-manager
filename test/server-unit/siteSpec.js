var Site = require('../../src/site.js');
var path = require('path');
var resources = require('./utils/resources.js');

var resourcesPath = path.resolve(__dirname, 'resources');

describe("Site", function() {
	it("can load", function(done) {
		resources.use(function(resourcesPath) {
			var site = new Site("test", path.resolve(resourcesPath, 'site-collection/sites/test'));
			site.on('fail', function(task, error) { this.fail(error); done(); }.bind(this));
			var task = site.loadTask();
			// task.on('log', console.log.bind(console)); // for debugging
			site.schedule(task);
			task.then(function() {
				expect(site.isLoaded).toBe(true);
				expect(site.isLoadFailed).toBe(false);
				expect(site.isClean).toBe(true);
				expect(site.revision).toBe('bb453f7185d777791cdf5c05ee7ff2efe31b7bba');
				expect(site.upstreamRevision).toBe('193ce1bf645dd342dc0216a8bda75dc9477b42d7');
				expect(site.branch).toBe('master');
				expect(site.aheadBy).toBe(0);
				expect(site.behindBy).toBe(1);
				expect(site.canUpgrade).toBe(true);
				done();
			});
		});
	}, 5000);
	
	it("can upgrade", function(done) {
		resources.use(function(resourcesPath) {
			var site = new Site("test", path.resolve(resourcesPath, 'site-collection/sites/test'));
			var task = site.upgradeTask();
			site.schedule(task);
			task.then(function() {
				expect(site.isLoaded).toBe(true);
				expect(site.isLoadFailed).toBe(false);
				expect(site.isClean).toBe(true);
				expect(site.revision).toBe('193ce1bf645dd342dc0216a8bda75dc9477b42d7');
				expect(site.upstreamRevision).toBe('193ce1bf645dd342dc0216a8bda75dc9477b42d7');
				expect(site.branch).toBe('master');
				expect(site.aheadBy).toBe(0);
				expect(site.behindBy).toBe(0);
				expect(site.canUpgrade).toBe(false);
			})
			.catch(function(err) { this.fail(err); }.bind(this))
			.then(done);
		}.bind(this));
	});
});
