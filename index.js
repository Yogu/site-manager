var server = require('./src/server.js');
var path = require('path');
var resources = require('./test/utils/resources.js');

resources.use(function(path) {
	server.start(process.env.PORT || 8888, path + '/site-collection');
});
