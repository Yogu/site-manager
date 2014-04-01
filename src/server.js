var http = require('http');
var express = require("express");
var socketio = require('socket.io');

exports.start = function(port) {
	var app = express();
	var server = http.createServer(app);
	app.use(express.static(__dirname+'/../public'));
	var io = socketio.listen(server);
	
	server.listen(port, function() {
		console.log('server started on port ' + port);
	});
};
