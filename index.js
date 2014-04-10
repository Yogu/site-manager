var server = require('./src/server.js');
var path = require('path');

server.start(process.env.PORT || 8888, path.resolve(__dirname, 'test/server-unit/resources/site-collection'));
