define(['angular', 'app'], function(angular, app) {
	app.config([ '$routeProvider', function($routeProvider) {
		$routeProvider.when('/', {
			templateUrl : 'partials/index.html',
			controller : 'SiteListCtrl'
		})
		.when('/sites/:site', {
			templateUrl : 'partials/site-overview.html',
			controller : 'SiteOverviewCtrl'
		})
		.when('/sites/:site/tasks', {
			templateUrl : 'partials/site-tasks.html',
			controller : 'SiteTasksCtrl'
		})
		.when('/sites/:site/tasks/:id', {
			templateUrl : 'partials/task.html',
			controller : 'SiteTaskCtrl'
		})
		.when('/tasks', {
			templateUrl : 'partials/global-tasks.html',
			controller : 'GlobalTasksCtrl'
		})
		.when('/tasks/:id', {
			templateUrl : 'partials/task.html',
			controller : 'GlobalTaskCtrl'
		})
		.otherwise({
			redirectTo : '/'
		});
	} ]);
});
