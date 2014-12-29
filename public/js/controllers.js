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

		.controller('SiteOverviewCtrl', [ '$scope', '$routeParams', '$location', 'model', function($scope, $routeParams, $location,model) {
			model.getSite($routeParams.site).then(function(site) {
				$scope.site = site;
				if ($scope.site.stagingOf) {
					model.getSite(site.stagingOf).then(function(s) {
						$scope.stagingOfSite = s;
					});
				}
			});
			$scope.status = function(site) {
				if (!site.branch)
					return 'not tracking any branch';
				if (site.aheadBy > 0)
					return 'error: ahead by ' + site.aheadBy + ' commits';
				if (!site.isClean)
					return 'error: uncommitted changes';
				if (site.behindBy === 0)
					return 'up to date';
				return 'upgrade available (' + site.behindBy + ' commits), to ' + site.upstreamRevision;
			};
			$scope.upgrade = function() {
				model.upgrade($scope.site);
			};
			$scope.reset = function() {
				if (!confirm('Do you really want to RESET the site ' + $scope.site.name + ', removing all its data? A backup will be created.'))
					return;

				model.reset($scope.site);
			};
			$scope.resetStaging = function() {
				model.resetStaging($scope.site);
			};
			$scope.upgradeToStaging = function() {
				if (!confirm('Do you want to upgrade the site ' + $scope.site.stagingOf + ' to the revision of this staging site?')) {
					return;
				}

				model.upgradeToRevision($scope.stagingOfSite, $scope.site.revision);
			};
			$scope.delete = function() {
				if (!confirm('Do you really want to DELETE the site ' + $scope.site.name + '? The backups will be kept.'))
					return;

				model.deleteSite($scope.site);
				$location.path('/');
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

				$scope.restore = function(revision) {
					model.restore($scope.site, revision);
				};

				return model.getBackups(site);
			})
			.then(function(backups) {
				$scope.backups = backups;
			});
		} ])

		.controller('SiteBackupCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.getSite($routeParams.site)
				.then(function(site) {
					$scope.site = site;

					return model.getBackup(site, $routeParams.revision);
				})
				.then(function(backup) {
					$scope.backup = backup;
					$scope.restore = function() {
						model.restore($scope.site, backup);
					};
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
