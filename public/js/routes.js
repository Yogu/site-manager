define(['angular', 'app'], function(angular, app) {
	app.config([ '$routeProvider', function($routeProvider) {
		$routeProvider.when('/', {
			templateUrl : 'partials/index.html',
			controller : 'SiteListCtrl'
		}).when('/sites/:name', {
			templateUrl : 'partials/site-overview.html',
			controller : 'SiteOverviewCtrl'
		}).otherwise({
			redirectTo : '/'
		});
	} ]);
});
