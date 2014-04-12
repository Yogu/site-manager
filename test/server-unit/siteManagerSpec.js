var SiteManager = require('../../src/siteManager.js');
var Site = require('../../src/site.js');
var resources = require('../utils/resources.js');

describe("SiteManager", function() {
	it("loads config properly", function(done) {
		resources.use(function(path) {
			path += '/site-collection';
			var manager = new SiteManager(path);
			manager.on('fail', function(task, error) { this.fail(error); done(); }.bind(this));
			
			manager.schedule(manager.loadTask());
			manager.on('load', function() {
				expect(manager.sites.length).toBe(2);
				
				expect(manager.sites[0]).toBeInstanceOf(Site);
				expect(manager.sites[0].name).toBe('test');
				expect(manager.sites[0].path).toBe(path + '/sites/test');
	
				expect(manager.sites[1]).toBeInstanceOf(Site);
				expect(manager.sites[1].name).toBe('dev');
				expect(manager.sites[1].path).toBe(path + '/dev-site');
				done();
			});
		}.bind(this));
	}, 5000);
});
