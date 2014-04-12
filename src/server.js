var http = require('http');
var express = require("express");
var socketio = require('socket.io');
var Controller = require('./controller.js');
var objects = require('./objects.js');

exports.start = function(port, dir) {
	var app = express();
	var server = http.createServer(app);
	app.use(express.static(__dirname+'/../public'));
	app.use(require('express-promise')());
	var io = socketio.listen(server);
	io.set('log level', 2 /* do not log debug messages */);
	
	var controller = new Controller(dir);
	
	server.listen(port, function() {
		console.log('server started on port ' + port + ' for root dir ' + dir);
	});
	
	app.get('/api/sites', function(req, res) {
		controller.getSites().then(function(sites) {
			res.json(objects.extract( { sites: sites }, {'sites[]': '*'}));
		}).catch(function(e) {
			console.error(e.stack);
			res.send(500);
		});
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
	
	return server;
};
