define(['angular', 'socket'], function(angular) {
	angular.module('myApp.model', ['socket']).factory('model', ['$http', 'socket',
			function($http, socket) {
		
		var exports = {
			sites: [ ],
			
			tasks: [ ],
			
			/**
			 * Promise being fulfilled when the sites are initially loaded
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
			}),
			
			reload: function() {
				$http.post('api/reload');
			}
		};
		
		socket.on('task:schedule', function(task) {
			console.log(task);
			exports.tasks.unshift(task);
		});
		
		function findTask(id) {
			var tasks = exports.tasks.filter(function(task) { return task.id == id;});
			if (tasks.length)
				return tasks[0];
			return null;
		}
		
		socket.on('task:status', function(taskID, status) {
			var existing = findTask(taskID);
			if (existing) {
				existing.status = status;
				console.log(existing);
			}
		});
		
		socket.on('task:log', function(taskID, message) {
			var existing = findTask(taskID);
			if (existing)
				existing.log.push(message);
		});
		
		return exports;
	}]);
});
