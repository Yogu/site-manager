var SiteManager = require('../../src/siteManager.js');
var Site = require('../../src/site.js');
var resources = require('../utils/resources.js');
var fs = require('q-io/fs');

describe("SiteManager", function() {
	it("loads config properly", function(done) {
		resources.use(function(path) {
			path += '/site-collection';
			var manager = new SiteManager(path);
			manager.on('fail', function(task, error) { this.fail(error); done(); }.bind(this));

			manager.schedule(manager.loadTask());
			manager.on('load', function() {
				expect(manager.sites.length).toBe(6);

				expect(manager.sites[0]).toBeInstanceOf(Site);
				expect(manager.sites[0].name).toBe('test');
				expect(manager.sites[0].path).toBe(path + '/sites/test');

				expect(manager.sites[1]).toBeInstanceOf(Site);
				expect(manager.sites[1].name).toBe('dev');
				expect(manager.sites[1].path).toBe(path + '/sites/dev');
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
						expect(task.plainLog).toMatch(/.*sites test, dev, staging.* will be upgraded.*/);
						expect(task.plainLog).toMatch(/.*branches master.* have been updated.*/);
						expect(scheduledTasks).toEqual(['Upgrade']);
						done();
					});
				});
			});
		}.bind(this));
	}, 5000);

	it("can add new site", function(done) {
		resources.use(function(path) {
			path += '/site-collection';
			var manager = new SiteManager(path);
			manager.on('fail', function(task, error) { this.fail(error); done(); }.bind(this));
			manager.schedule(manager.loadTask());

			manager.once('load', function() {
				var task = manager.addSiteTask('new-site', 'master');
				manager.schedule(task);
				task.then(function() {
					var sites = manager.sites.filter(function(s) { return s.name == 'new-site'; });
					expect(sites.length).toBeGreaterThan(0);
					return sites[0].loaded;
				})
				.catch(function(err) { this.fail(err); }.bind(this))
				.then(done);
			}.bind(this));
		}.bind(this));
	}, 5000);

	it("can delete sites", function(done) {
		resources.use(function(path) {
			path += '/site-collection';
			var manager = new SiteManager(path);

			manager.on('fail', function(task, error) { this.fail(error); done(); }.bind(this));
			manager.schedule(manager.loadTask());

			manager.once('load', function() {
				var site = manager.getSite('test');
				var task = manager.deleteSiteTask(site);
				site.schedule(task);
				task.then(function() {
					return fs.exists(path + '/sites/test');
				}).then(function(pathExists) {
					expect(pathExists).toBe(false);
				})
				.catch(function(err) { this.fail(err); }.bind(this))
				.then(done);
			}.bind(this));
		}.bind(this));
	}, 5000);

	it("can add a merge request site", function(done) {
		resources.use(function(path) {
			path += '/site-collection';
			var manager = new SiteManager(path);
			manager.on('fail', function(task, error) { this.fail(error); done(); }.bind(this));
			manager.schedule(manager.loadTask());

			manager.once('load', function() {
				var task = manager.createMergeRequestSiteTask('mr2', 'second-feature', 'master');
				manager.schedule(task);
				task.then(function() {
					var sites = manager.sites.filter(function(s) { return s.name == 'mr2'; });
					expect(sites.length).toBeGreaterThan(0);
					return sites[0].loaded;
				})
						.catch(function(err) { this.fail(err); }.bind(this))
						.then(done);
			}.bind(this));
		}.bind(this));
	}, 5000);
});
