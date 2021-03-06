require('./compat.js');
var Promise = require('es6-promise').Promise;

function extract(object, properties) {
	var dest = {};
	
	if (typeof properties == 'string')
		properties = [properties];
	
	// primitives
	if (typeof properties != 'object') {
		if (properties !== true)
			throw new Error("properties must be either object, array or true");
		
		switch (typeof object) {
			case 'string':
			case 'number':
			case 'boolean':
				return object;
			case 'object':
				if (object != null && object.constructor == Date)
					return object;
			default:
				return null;
		}
	}
	
	// convert ['a', 'b'] to { a: true, b: true }
	if (properties instanceof Array) {
		var newProperties = {};
		for (var i = 0; i < properties.length; i++) {
			if (typeof properties[i] != 'string')
				throw new Error('array specifications may only contain strings, found ' + 
						JSON.stringify(properties[i]));
			newProperties[properties[i]] = true;
		}
		properties = newProperties;
	}
	
	var propertyNames = Object.getOwnPropertyNames(properties);
	for (var name in properties) {
		if (!properties.hasOwnProperty(name))
			continue;
		var specification = properties[name];
		
		if (name == '[]') {
			if (propertyNames.length > 1)
				throw new Error('[] must be the single property specification');
			
			if (object instanceof Array) {
				return object.map(function(item) { return extract(item, specification); });
			} else
				return null;
		} else if (name == '.') {
			if (propertyNames.length > 1)
				throw new Error('. must be the single property specification');
			
			return extract(object, specification);
		} else if (name == '*') {
			for (name in object) {
				if (name[0] == '_' || name in dest)
					continue;
				var result = extract(object[name], true /* only primitives */);
				if (result !== null)
					dest[name] = result;
			}
		} else {
			// extract the array specification
			if (name.endsWith('[]')) {
				name = name.substring(0, name.length - 2);
				specification = { '[]': specification };
			}
			if (name in object)
				dest[name] = extract(object[name], specification);
		}
	}
	
	return dest;
};
exports.extract = extract;
