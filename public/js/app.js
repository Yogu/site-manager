define([ 'angular', 'model', 'controllers', 'angularRoute', 'angularFilters' ],
function(angular, model, controllers) {
	'use strict';

	return angular.module('myApp', [ 'ngRoute', 'myApp.controllers', 'myApp.model', 'frapontillo.ex.filters' ]);
});
