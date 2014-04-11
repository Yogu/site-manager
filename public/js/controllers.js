define([ 'angular', 'model' ], function(angular) {
	'use strict';

	return angular.module('myApp.controllers', [ 'myApp.model' ])
		.controller('SiteNavCtrl', [ '$scope', 'model', function($scope, model) {
			$scope.sites = model.sites;
		} ])
		
		.controller('GlobalTasksCtrl', [ '$scope', 'model', function($scope, model) {
			$scope.tasks = model.tasks;
			$scope.hide = function(task) {
				task.alertIsHidden = true;
			};
			$scope.isVisible = function(task) { return !task.alertIsHidden; };
		} ])
		
		.controller('SiteListCtrl', [ '$scope', 'model', function($scope, model) {
			$scope.sites = model.sites;
			$scope.reload = function() {
				model.reload();
			};
		} ])
		
		.controller('SiteOverviewCtrl', [ '$scope', '$routeParams', 'model', function($scope, $routeParams, model) {
			model.loaded.then(function() {
				var sites = model.sites.filter(function(site) { return site.name == $routeParams.name; });
				if (sites.length > 0)
					$scope.site = sites[0];
			});
		} ]);
});
