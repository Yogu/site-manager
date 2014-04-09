define(['model'], function() {
	describe("model", function() {
	    beforeEach(module('myApp.model'));
	    
		it("exists", inject(function(model) {
			expect(typeof model).toBe('object');
		}));
	});
});
