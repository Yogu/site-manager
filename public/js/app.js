define([ 'angular', 'model', 'controllers', 'filters', 'angularRoute', 'angularFilters',
         'angularSanitize'],
function(angular, model, controllers) {
	'use strict';

	return angular.module('myApp',
			[ 'ngRoute', 'myApp.controllers', 'myApp.model',
			  'myApp.filters', 'frapontillo.ex.filters', 'ngSanitize' ]);
});
