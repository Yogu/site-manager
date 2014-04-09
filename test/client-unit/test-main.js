var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/Spec\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/public/js'
});

require(['angular'], function() {
	require(['angularMocks'], function() {
		require(tests, window.__karma__.start);
	});
});
