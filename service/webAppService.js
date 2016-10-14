var fs = require('fs');
exports.get_by_month = function(param) {
	param = param || {};
	if (!param.city) {
		param.city = 'cd';
	}

	if (!param.zone) {
		param.zone = 'dy';
	}

	if (!param.year) {
		param.year = '2016';
	}
	if (!param.month) {
		param.month = '10';
	}
	var res = {};
	for (var i = 1; i < 32; i++) {
		try {
			var content = fs.readFileSync('./data/' + param.city + '/' + param.zone + '/' + param.year + '-' + param.month + '-' + i + '.json', 'utf-8');
			if (content) {
				content = JSON.parse(content);
				res[param.year + '-' + param.month + '-' + i] = (content);
			}
		} catch (ex) {

		}
	}
	return res;
}