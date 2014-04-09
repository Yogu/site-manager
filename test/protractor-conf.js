exports.config = {
	allScriptsTimeout: 11000,

	specs: [
		'end-to-end/*.js'
	],

	capabilities: {
		browserName: 'Chrome'
	},

	chromeOnly: true,

	baseUrl: 'http://localhost:8888/',

	framework: 'jasmine',

	jasmineNodeOpts: {
		defaultTimeoutInterval: 30000
	}
};
