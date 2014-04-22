var http = require('http');
var express = require("express");
var socketio = require('socket.io');
var Controller = require('./controller.js');
var objects = require('./objects.js');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');

require('q').longStackSupport = true;

expressValidator.validator.extend('isIdentifier', function (str) {
	if (typeof str != 'string')
		return false;
	return str.match(/[a-zA-Z0-9_\-\.]+/) !== null;
});

exports.start = function(port, dir) {
	var app = express();
	var server = http.createServer(app);
	app.use(express.static(__dirname+'/../public'));
	app.use(require('express-promise')());
	app.use(expressValidator());
	app.use(bodyParser.json());
	var io = socketio.listen(server);
	io.set('log level', 2 /* do not log debug messages */);
	
	var controller = new Controller(dir);
	
	server.listen(port, function() {
		console.log('server started on port ' + port + ' for root dir ' + dir);
	});
	
	app.get('/api/sites', function(req, res) {
		controller.getSites().then(function(sites) {
			res.json(objects.extract( { sites: sites }, {'sites[]': {'*': true, dbConfig: '*'} } ));
		}).catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	app.post('/api/sites', function(req, res) {
		req.checkBody('siteName').isIdentifier();
		req.checkBody('branch').isIdentifier();
		var errors = req.validationErrors();
		if (errors)
			return res.send('Validation errors: ' + JSON.stringify(errors), 400);
		
		var task = controller.manager.addSiteTask(req.body.siteName, req.body.branch);
		controller.manager.schedule(task);
		res.json({taskID: task.id});
	});
	
	app.post('/api/reload', function(req, res) {
		controller.reload();
		res.send(202 /* accepted */);
	});
	
	app.post('/api/fetch', function(req, res) {
		controller.manager.schedule(controller.manager.fetchTask());
		res.send(202 /* accepted */);
	});
	
	app.post('/api/sites/:site/upgrade', function(req, res) {
		controller.getSite(req.params.site)
		.then(function(site) {
			site.schedule(site.upgradeTask());
			res.send(202 /* accepted */);
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	app.post('/api/sites/:site/backups', function(req, res) {
		controller.getSite(req.params.site)
		.then(function(site) {
			var message = String(req.body.message || '').trim();
			message = message ? 'manual: ' + message : 'manual';
			site.schedule(site.backupTask(message));
			res.send(202 /* accepted */);
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	app.post('/api/sites/:site/reset', function(req, res) {
		controller.getSite(req.params.site)
		.then(function(site) {
			site.schedule(site.resetTask());
			res.send(202 /* accepted */);
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	app.get('/api/sites/:site/backups', function(req, res) {
		controller.getSite(req.params.site)
		.then(function(site) {
			return site.getBackups();
		})
		.then(function(backups) {
			res.json(objects.extract( { backups: backups }, {'backups[]': '*'}));
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});

	app.get('/api/sites/:site/backups/:revision', function(req, res) {
		controller.getSite(req.params.site)
			.then(function(site) {
				return site.getBackup(req.params.revision);
			})
			.then(function(backup) {
				res.json(objects.extract(backup, '*'));
			})
			.catch(function(e) {
				console.error(e.stack);
				res.send(500);
			});
	});

	app.post('/api/sites/:site/backups/:revision/restore', function(req, res) {
		controller.getSite(req.params.site)
			.then(function(site) {
				site.schedule(site.restoreTask(req.params.revision));
				res.send(200 /* accepted */);
			})
			.catch(function(e) {
				console.error(e.stack);
				res.send(500);
			});
	});
	
	app.get('/api/tasks', function(req, res) {
		controller.manager.getTasks(0, 20)
		.then(function(tasks) {
			res.json(objects.extract( { tasks: tasks }, {'tasks[]': '*'}));
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	app.get('/api/sites/:site/tasks', function(req, res) {
		controller.getSite(req.params.site)
		.then(function(site) {
			return site.getTasks(0, 20);
		})
		.then(function(tasks) {
			res.json(objects.extract( { tasks: tasks }, {'tasks[]': '*'}));
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	app.get('/api/sites/:site/tasks/:id', function(req, res) {
		controller.getSite(req.params.site)
		.then(function(site) {
			return site.getTask(req.params.id);
		})
		.then(function(task) {
			res.json(objects.extract(task, '*'));
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	app.get('/api/tasks/:id', function(req, res) {
		controller.manager.getTask(req.params.id)
		.then(function(task) {
			res.json(objects.extract(task, '*'));
		})
		.catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
	});
	
	controller.on('task:schedule', function(task) {
		var context = task.context;
		task = objects.extract(task, '*');
		task.site = context.name || null; // site name, if not site manager
		io.sockets.emit('task:schedule', task);
	});
	
	controller.on('task:status', function(task) {
		io.sockets.emit('task:status', task.id, task.status);
	});
	
	controller.on('task:log', function(task, message) {
		io.sockets.emit('task:log', task.id, message);
	});
	
	controller.on('site:load', function(site) {
		io.sockets.emit('site:load', site.name, objects.extract(site, '*'));
	});
	
	controller.on('site:backups', function(site) {
		io.sockets.emit('site:backups', site.name);
	});
	
	controller.on('manager:load', function(sites) {
		io.sockets.emit('manager:load');
	});
	
	return server;
};
