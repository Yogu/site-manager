requirejs.config({
	paths: {
		angular: '../bower_components/angular/angular',
		angularRoute: '../bower_components/angular-route/angular-route',
		angularMocks: '../bower_components/angular-mocks/angular-mocks',
		jquery: '../bower_components/jquery/dist/jquery',
		bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
		es6promise: '../bower_components/es6-promise/promise'
	},
	shim: {
        bootstrap: ['jquery'],
        angular: { exports: 'angular' },
    	angularRoute: ['angular'],
        main: {
        	// compatibility
        	deps: ['es6promise']
        }
	},
	priority: [
		'angular'
	]
});

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require( [
	'angular',
	'app',
	'routes'
	], function(angular, app, routes) {
		'use strict';
		var $html = angular.element(document.getElementsByTagName('html')[0]);
		
		angular.element().ready(function() {
		if (angular.resumeBootsrap)
			angular.resumeBootstrap([app['name']]);
	});
});
