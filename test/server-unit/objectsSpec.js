var extract = require('../../src/objects.js').extract;
var Promise = require('es6-promise').Promise;

describe('objects.extract()', function() {
	it('works for primitives', function() {
		expect(extract(1, '.')).toBe(1);
		expect(extract(true, '.')).toBe(true);
		expect(extract("hey", '.')).toBe("hey");
		expect(extract(new Date(12345), '.')).toEqual(new Date(12345));
		expect(extract(null, '.')).toBe(null);

		expect(extract(1, ['.'])).toBe(1);
		expect(extract(true, ['.'])).toBe(true);
		expect(extract("hey", ['.'])).toBe("hey");
	});

	it('rejects objects when primitive is specified', function() {
		expect(extract({}, '.')).toBe(null);
		expect(extract([], '.')).toBe(null);
		
		expect(extract({}, ['.'])).toBe(null);
		expect(extract([], ['.'])).toBe(null);
	});

	it('extracts primitive fields of objects', function() {
		expect(extract({a: 1, b: 2, c: 3}, ['a', 'b'])).toEqual({a: 1, b: 2});
		expect(extract({a: 1, b: 2, c: 3}, 'a')).toEqual({a: 1});
		expect(extract({a: 1, b: 2, c: 3}, ['d'])).toEqual({});
	});

	it('rejects arrays when objects specified', function() {
		expect(extract([1,2], ['a', 'b'])).toEqual({});
		expect(extract([], ['a', 'b'])).toEqual({});
	});

	it('works for arrays of primitives', function() {
		expect(extract([1, 2], '[]')).toEqual([1,2]);
	});

	it('extracts array fields of objects', function() {
		expect(extract({a: [1,2], b: 123}, 'a[]')).toEqual({a: [1,2]});
		expect(extract({a: [1,2], b: 123}, {'a': '[]'})).toEqual({a: [1,2]});
		expect(extract({a: [1,2], b: 123}, {'a': '[]'})).toEqual({a: [1,2]});
		expect(extract({a: [1,2], b: true, c: [3,4]}, ['a[]', 'b'])).toEqual({a: [1,2], b: true});
		var obj = [1, 2, 3];
		obj.property = 'value';
		expect(obj).not.toEqual([1,2,3]);
		expect(extract(obj, '[]')).toEqual([1,2,3]);
	});
	
	it("extracts all primitive properties excluding underscored ones with * selector", function() {
		expect(extract({a: 1, b: 2, _b: 4, c: {a: 1}, d: [1, 2]}, '*')).toEqual({a: 1, b: 2});
	});
	
	it('works with deep objects', function() {
		var source = {customers: [ {
				name: 'John Doe',
				town: 'New York',
				
			}, {
				name: 'Harry Smith',
				town: 'London'
			},
			]};
		var pattern = { 'customers[]': [ 'name' ] };
		var expected = { customers: [ { name: 'John Doe' }, { name: 'Harry Smith' } ] };
		expect(extract(source, pattern)).toEqual(expected);
	});
});
