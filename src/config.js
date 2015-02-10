var fs = require('q-io/fs');

function Config(path) {
	this.path = path;
	this.reload();
}

Config.prototype.get = function(key) {
	return this.loaded.then(function(data) {
		return data[key];
	}.bind(this));
};

Config.prototype.set = function(key, value) {
	return this.loaded.then(function(data) {
		if (typeof value === 'function') {
			value = value(data[key]);
		}
		data[key] = value;
		this._save(data);
		return value;
	}.bind(this));
}

Config.prototype._save = function(data) {
	this.loaded = fs.write(this.path, JSON.stringify(data))
			.then(function() {
				return data;
			});
};

Config.prototype.reload = function() {
	this.loaded = fs.exists(this.path)
			.then(function(exists) {
				if (exists) {
					return fs.read(this.path).then(JSON.parse);
				} else {
					return {};
				}
			}.bind(this));
};

module.exports = Config;
