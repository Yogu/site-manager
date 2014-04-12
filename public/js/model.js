define(['angular', 'socket'], function(angular) {
	angular.module('myApp.model', ['socket']).factory('model', ['$http', '$q', 'socket',
			function($http, $q, socket) {
		
		var exports = {
			sites: [ ],
			
			tasks: [ ],
			
			globalTasks: [],
			
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
			},
			
			getSite: function(name) {
				return this.loaded.then(function() {
					var sites = this.sites.filter(function(site) { return site.name == name; });
					if (sites.length == 0)
						throw new Error('There is no site called ' + name);
					return sites[0];
				}.bind(this));
			},
			
			getTask: function(site, id) {
				var task = findTask(id);
				if (task) {
					var deferred = $q.defer();
					deferred.resolve(task);
					return deferred.promise;
				}
				
				return $http.get('api/sites/' + site.name + '/tasks/' + id)
				.then(function(res) {
					return res.data;
				});
			},
			
			getSiteTasks: function(site) {
				return $http.get('api/sites/' + site.name + '/tasks')
				.then(function(res) {
					return res.data.tasks;
				});
			}
		};
		
		socket.on('task:schedule', function(task) {
			exports.tasks.unshift(task);
			
			if (task.site) {
				exports.getSite(task.site).then(function(site) {
					if (!site.tasks)
						site.tasks = [];
					site.tasks.unshift(task);
				});
			} else {
				exports.globalTasks.unshift(task);
			}
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
			}
		});
		
		socket.on('task:log', function(taskID, message) {
			var existing = findTask(taskID);
			if (existing)
				existing.log += message + "\n";
		});
		
		return exports;
	}]);
});
