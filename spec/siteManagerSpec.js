var SiteManager = require('../src/siteManager.js');
var Site = require('../src/site.js');
var path = require('path');

var resourcesPath = path.resolve(__dirname, 'resources');

describe("SiteManager", function() {
	it("loads config properly", function(done) {
		var manager = new SiteManager(path.resolve(resourcesPath, 'site-collection'));
		manager.on('load', function() {
			expect(manager.sites.length).toBe(2);
			
			expect(manager.sites[0]).toBeInstanceOf(Site);
			expect(manager.sites[0].name).toBe('test');
			expect(manager.sites[0].path).toBe(path.resolve(resourcesPath, 'site-collection/sites/test'));

			expect(manager.sites[1]).toBeInstanceOf(Site);
			expect(manager.sites[1].name).toBe('dev');
			expect(manager.sites[1].path).toBe(path.resolve(resourcesPath, 'site-collection/dev-site'));
			done();
		});
	});
});
