exports.stripColors = function(input) {
	return input.replace(/\033\[[0-9;]*m/g,"");
};
