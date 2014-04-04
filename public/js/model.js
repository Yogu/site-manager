define(['angular'], function(angular) {
	angular.module('myApp.model', []).factory('model', ['$http', '$timeout', function($http, $timeout) {
		var exports = {
			sites: [ ],
			
			/**
			 * Promies to be fulfilled when the sites are initially loaded
			 */
			loaded: $http.get('api/sites').success(function(data) {
				// do not break existing references
				var existingSites = {};
				exports.sites.forEach(function(site) { existingSites[site.name] = site; });
				exports.sites.length = 0;
				data.sites.forEach(function(newSite) { 
					if (newSite.name in existingSites)
						newSite = angular.extend(existingSites[newSite.name], newSite);
					exports.sites.push(newSite);
				});
			})
		};
		
		return exports;
	}]);
});
