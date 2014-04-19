define(['angular', 'ansi2html'], function(angular, ansi2html) {
	ansi2html.table[33] = { color: 'rgb(255, 133, 0)' };
	
	angular.module('myApp.filters', ['ngSanitize'])
	.filter('ansi2html', ['$sce', function($sce) {
		return function(ansi) {
			ansi = ansi || '';
			ansi = ansi.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt')
				.replace('"', '&quot;');
			return $sce.trustAsHtml(ansi2html(ansi));
		};
	}])
});
