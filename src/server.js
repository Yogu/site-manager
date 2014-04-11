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
		io.sockets.emit('task:status', task.id, message);
	});
	
	return server;
};
