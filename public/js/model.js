define(['angular', 'socket'], function(angular) {
	angular.module('myApp.model', ['socket']).factory('model', ['$http', '$q', 'socket',
			function($http, $q, socket) {
		/**
		 * Promise being fulfulled when there is no reload in progress
		 */
		var reloaded = load();

		var exports = {
			sites: [ ],

			tasks: [ ],

			globalTasks: [],

			/**
			 * Promise being fulfilled when the sites are initially loaded
			 */
			loaded: reloaded,

			reload: function() {
				$http.post('api/reload');
			},

			fetch: function() {
				$http.post('api/fetch');
			},

			addSite: function(siteName, branch) {
				return $http.post('api/sites', {siteName: siteName, branch: branch})
				.then(function(res) {
					return res.data.taskID;
				});
			},

			upgrade: function(site) {
				$http.post('api/sites/'  + site.name + '/upgrade');
			},

			backup: function(site, message) {
				$http.post('api/sites/'  + site.name + '/backups', { message: message });
			},

			reset: function(site) {
				$http.post('api/sites/'  + site.name + '/reset');
			},

			deleteSite: function(site) {
				$http.delete('api/sites/'  + site.name);
			},

			restore: function(site, backup) {
				$http.post('api/sites/'  + site.name + '/backups/' + backup.revision + '/restore');
			},

			resetStaging: function(site) {
				$http.post('api/sites/'  + site.name + '/reset-staging');
			},

			getSite: function(name) {
				// if there is a reload in progress, wait until that finished as it may add a new site
				return reloaded.then(function() {
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

				var url = site ? 'sites/' + site.name + '/tasks' : 'tasks';

				return $http.get('api/' + url + '/' + id)
				.then(function(res) {
					if (!findTask(id)) { // check again if it exists now
						res.data.alertIsHidden = true; // should not be displayed in the alert bar
						exports.tasks.push(res.data); // cache it

					}
					return res.data;
				});
			},

			getSiteTasks: function(site) {
				return $http.get('api/sites/' + site.name + '/tasks')
				.then(function(res) {
					return res.data.tasks;
				});
			},

			getGlobalTasks: function() {
				// TODO: this could sometime fetch all tasks
				return $http.get('api/tasks')
					.then(function(res) {
						return res.data.tasks;
					});
			},

			getBackups: function(site) {
				return $http.get('api/sites/' + site.name + '/backups')
					.then(function(res) {
						return res.data.backups;
					});
			},

			getBackup: function(site, revision) {
				return $http.get('api/sites/' + site.name + '/backups/' + revision)
					.then(function(res) {
						return res.data;
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
				if (!existing.startTime)
					existing.startTime = new Date();
				if (status != 'running' && !existing.endTime) {
					existing.endTime = new Date();
					existing.duration = existing.endTime.getTime() - existing.startTime.getTime();
				}
				existing.status = status;
			}
		});

		socket.on('task:log', function(taskID, message) {
			var existing = findTask(taskID);
			if (existing)
				existing.log += message + "\n";
		});

		socket.on('site:load', function(name, data) {
			exports.getSite(name).then(function(site) {
				for (propertyName in data) {
					if (data.hasOwnProperty(propertyName))
						site[propertyName] = data[propertyName];
				}
			});
		});

		socket.on('manager:load', load);

		function load() {
			reloaded = $http.get('api/sites').success(function(data) {
				// do not break existing references
				var existingSites = {};
				exports.sites.forEach(function(site) { existingSites[site.name] = site; });
				exports.sites.length = 0;
				data.sites.forEach(function(newSite) {
					if (newSite.name in existingSites)
						newSite = angular.extend(existingSites[newSite.name], newSite);
					exports.sites.push(newSite);
				});
			});
			return reloaded;
		}

		return exports;
	}]);
});
