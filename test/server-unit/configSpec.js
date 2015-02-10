var Config = require('../../src/config.js');
var resources = require('../utils/resources.js');
var fs = require('q-io/fs');

describe("Config", function() {
	it("loads existing file", function(done) {
		resources.withEmptyDir(function(path) {
			path += '/config.json';
			fs.write(path, JSON.stringify({key: 'value'}))
					.then(function() {
						return new Config(path).get('key')
					})
					.then(function(value) {
						expect(value).toBe('value');
						done();
					})
					.catch(function(e) {
						this.fail(e);
					}.bind(this));
		}.bind(this));
	}, 5000);

	it("allows setting a value", function(done) {
		resources.withEmptyDir(function(path) {
			path += '/config.json';
			var config;
			fs.write(path, JSON.stringify({key: 'value'}))
					.then(function() {
						config = new Config(path);
						return config.set('key', 'new-value');
					})
					.then(function(value) {
						expect(value).toBe('new-value');
						return config.loaded; // wait for sync
					}).then(function() {
						return fs.read(path);
					})
					.then(function(content) {
						expect(content).toBe(JSON.stringify({key: 'new-value'}));
						done();
					})
					.catch(function(e) {
						this.fail(e);
					}.bind(this));
		}.bind(this));
	}, 5000);

	it("allows setting a value via callback", function(done) {
		resources.withEmptyDir(function(path) {
			path += '/config.json';
			var config;
			fs.write(path, JSON.stringify({key: 1}))
					.then(function() {
						config = new Config(path);
						return config.set('key', function(old) { return old + 1 });
					})
					.then(function(value) {
						expect(value).toBe(2);
						return config.loaded; // wait for sync
					})
					.then(function() {
						return fs.read(path);
					})
					.then(function(content) {
						expect(content).toBe(JSON.stringify({key: 2}));
						done();
					})
					.catch(function(e) {
						this.fail(e);
					}.bind(this));
		}.bind(this));
	}, 5000);

	it("updates get() after set()", function(done) {
		resources.withEmptyDir(function(path) {
			path += '/config.json';
			fs.write(path, JSON.stringify({key: 1}))
					.then(function() {
						var config = new Config(path);
						config.set('key', function(old) { return old + 1 });
						return config.get('key');
					})
					.then(function(value) {
						expect(value).toBe(2);
						done();
					})
					.catch(function(e) {
						this.fail(e);
					}.bind(this));
		}.bind(this));
	}, 5000);

});
