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
	
	it("can fetch", function(done) {
		resources.use(function(path) {
			path += '/site-collection';
			var manager = new SiteManager(path);
			manager.on('fail', function(task, error) { this.fail(error); done(); }.bind(this));
			manager.schedule(manager.loadTask());
			
			manager.once('load', function() {
				var testSite = manager.sites.filter(function(s) { return s.name == 'test'; })[0];
				testSite.once('load', function() {
					var scheduledTasks = [];
					testSite.on('schedule', function(task) {
						scheduledTasks.push(task.name);
					});
					
					var task = manager.fetchTask();
					manager.schedule(task);
					task
					.then(function() {
						expect(task.plainLog).toContain('sites test will be upgraded');
						expect(task.plainLog).toContain('branches master have been updated');
						expect(scheduledTasks).toEqual(['Upgrade']);
						done();
					});
				});
			});
		}.bind(this));
	});
});
