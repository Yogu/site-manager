define([ 'angular', 'model', 'controllers', 'angularRoute' ],
function(angular, model, controllers) {
	'use strict';

	return angular.module('myApp', [ 'ngRoute', 'myApp.controllers', 'myApp.model' ]);
});
