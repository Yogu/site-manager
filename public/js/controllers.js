define([ 'angular', 'model' ], function(angular) {
	'use strict';

	return angular.module('myApp.controllers', [ 'myApp.model' ])
		.controller('SiteNavCtrl', [ '$scope', 'model', function($scope, model) {
			$scope.sites = model.sites;
		} ])
		
		.controller('TaskAlertsCtrl', [ '$scope', 'model', function($scope, model) {
			$scope.tasks = model.tasks;
			$scope.hide = function(task) {
				task.alertIsHidden = true;
			};
			$scope.isVisible = function(task) { return !task.alertIsHidden; };
		} ])
		
		.controller('SiteListCtrl', [ '$scope', 'model', function($scope, model) {
			$scope.sites = model.sites;
			$scope.reload = model.reload.bind(model);
			$scope.fetch = model.fetch.bind(model);
		} ])
		
		.controller('AddSiteCtrl', [ '$scope', '$location', 'model', function($scope, $location, model) {
			$scope.addSite = function() {
				model.addSite($scope.siteName, $scope.branch)
				.then(function(taskID) {
					// show the task that is creating the new site
					$location.path('/tasks/' + taskID);
				})
				.catch(function(err) {
					alert(JSON.stringify(err));
				});
			};
		} ])
		
		.controller('SiteOverviewCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.getSite($routeParams.site).then(function(site) {
				$scope.site = site;
			});
			$scope.status = function(site) {
				if (!site.branch)
					return 'not tracking any branch';
				if (site.aheadBy > 0)
					return 'error: ahead by ' + site.aheadBy + ' commits';
				if (!site.isClean)
					return 'error: uncommitted changes';
				if (site.behindBy == 0)
					return 'up to date';
				return 'upgrade available (' + site.behindBy + ' commits), to ' + site.upstreamRevision;
			};
			$scope.upgrade = function() {
				model.upgrade($scope.site);
			};
		} ])
		
		.controller('SiteBackupsCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.getSite($routeParams.site)
			.then(function(site) {
				$scope.site = site;
				
				$scope.createBackup = function() {
					var message = $scope.backupMessage;
					model.backup($scope.site, message);
				};
				
				return model.getBackups(site);
			})
			.then(function(backups) {
				$scope.backups = backups;
			});
		} ])
		
		.controller('SiteTasksCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.getSite($routeParams.site)
			.then(function(site) {
				$scope.site = site;
				return model.getSiteTasks(site);
			})
			.then(function(tasks) {
				$scope.tasks = tasks;
			});
		} ])
		
		.controller('GlobalTasksCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.getGlobalTasks()
			.then(function(tasks) {
				$scope.tasks = tasks;
			});
		} ])
		
		.controller('GlobalTaskCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.getTask(null, $routeParams.id)
			.then(function(task) {
				$scope.task = task;
			});
		} ])
		
		.controller('SiteTaskCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.getSite($routeParams.site)
			.then(function(site) {
				$scope.site = site;
				return model.getTask(site, $routeParams.id);
			})
			.then(function(task) {
				$scope.task = task;
			});
		} ]);
});
