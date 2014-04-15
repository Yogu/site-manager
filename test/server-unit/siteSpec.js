var Site = require('../../src/site.js');
var path = require('path');
var resources = require('../utils/resources.js');

var resourcesPath = path.resolve(__dirname, 'resources');

describe("Site", function() {
	it("can load", function(done) {
		resources.use(function(resourcesPath) {
			var site = new Site("test", path.resolve(resourcesPath, 'site-collection/sites/test'));
			var task = site.loadTask();
			// task.on('log', console.log.bind(console)); // for debugging
			site.schedule(task);
			task.then(function() {
				expect(site.isLoaded).toBe(true);
				expect(site.isLoadFailed).toBe(false);
				expect(site.isClean).toBe(true);
				expect(site.revision).toBe('0c3ba58efb54b70c53cc49a24a160bfcc5680c82');
				expect(site.upstreamRevision).toBe('7bf49e2636c5f54672e970b7fec548acd5b4bc13');
				expect(site.branch).toBe('master');
				expect(site.aheadBy).toBe(0);
				expect(site.behindBy).toBe(1);
				expect(site.canUpgrade).toBe(true);
			})
			.catch(function(err) { this.fail(err); }.bind(this))
			.then(done);
		}.bind(this));
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
				expect(site.revision).toBe('7bf49e2636c5f54672e970b7fec548acd5b4bc13');
				expect(site.upstreamRevision).toBe('7bf49e2636c5f54672e970b7fec548acd5b4bc13');
				expect(site.branch).toBe('master');
				expect(site.aheadBy).toBe(0);
				expect(site.behindBy).toBe(0);
				expect(site.canUpgrade).toBe(false);
			})
			.catch(function(err) { this.fail(err); }.bind(this))
			.then(done);
		}.bind(this));
	}, 5000);
});
