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
	
	return server;
};
