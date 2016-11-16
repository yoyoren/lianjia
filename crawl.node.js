var http = require('http');
var fs = require('fs');
var body;
var res_array = [];
var file_json = {};
var file_desc = [];
var reg_price = /span class\=\"price_total\"><em>(.+)<\/em>/;
var reg_unit_price = /span class\=\"unit_price\">(.+)<\/span>/;
var doMatch = function(text) {
	var price = reg_price.exec(text);
	var unit_price = reg_unit_price.exec(text);

	if (price && price.length) {
		console.log(price[1]);
		res_array.push({
			price: parseInt(price[1]),
			unit_price: parseInt(unit_price[1])
		});
		text = text.replace(unit_price[0], '');
		text = text.replace(price[0], '');
		doMatch(text);
	} else {
		return 'end';
		//console.log(res);
	}
}
var cur_date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();

var getPrice = function() {
	var price = 0;
	for (var i in res_array) {
		price += res_array[i].price;
	}
	return parseInt(price / res_array.length);
}

var getMinPrice = function() {
	var min_price = res_array[0].price;
	for (var i in res_array) {
		if (min_price > res_array[i].price) {
			min_price = res_array[i].price;
		}
	}
	return min_price;
}

var getMaxPrice = function() {
	var max_price = res_array[0].price;
	for (var i in res_array) {
		if (max_price < res_array[i].price) {
			max_price = res_array[i].price;
		}
	}
	return max_price;
}

var getSize = function() {
	var size = 0;
	for (var i in res_array) {
		var total_price = res_array[i].price;
		var unit_price = res_array[i].unit_price;
		size += ((total_price * 10000) / unit_price);
	}

	return parseInt(size / res_array.length);
}
var getMinSize = function() {
	var total_price = res_array[0].price;
	var unit_price = res_array[0].unit_price;
	var min_size = (total_price * 10000) / unit_price;
	for (var i in res_array) {
		if (min_size > (res_array[i].price * 10000) / res_array[i].unit_price) {
			min_size = (res_array[i].price * 10000) / res_array[i].unit_price;
		}
	}
	return parseInt(min_size);
}
var getMaxSize = function() {
	var total_price = res_array[0].price;
	var unit_price = res_array[0].unit_price;
	var max_size = total_price / unit_price;
	for (var i in res_array) {
		if (max_size < (res_array[i].price * 10000) / res_array[i].unit_price) {
			max_size = (res_array[i].price * 10000) / res_array[i].unit_price;
		}
	}
	return parseInt(max_size);
}

var getUnitPrice = function() {
	var price = 0;
	for (var i in res_array) {
		price += res_array[i].unit_price;
	}
	return parseInt(price / res_array.length);
}

var getMinUnitPrice = function() {
	var min_price = res_array[0].unit_price
	for (var i in res_array) {
		if (min_price > res_array[i].unit_price) {
			min_price = res_array[i].unit_price;
		}
	}
	return min_price;
}

var getMaxUnitPrice = function() {

	var max_price = res_array[0].unit_price
	for (var i in res_array) {
		if (max_price < res_array[i].unit_price) {
			max_price = res_array[i].unit_price;
		}
	}
	return max_price;
}


var getLianjiaZone = function(city) {
	var req = http.get({
		hostname: city + '.lianjia.com',
		port: 80,
		path: '/ershoufang/',
		agent: false // create a new agent just for this one request
	}, (res) => {
		var content = '';
		var do_timeout = false;
		var req_timeout = setTimeout(function() {
			do_timeout = true;
			console.log('time out and retry');
		}, 5000);
		res.on('data', function(chunk) {
			content += chunk;
		});

		res.on('error', function() {
			if (do_timeout) {
				return;
			}

		});

		res.on('end', function(chunk) {
			if (do_timeout) {
				return;
			}
			clearTimeout(req_timeout);
			content += chunk;
			var body = content;
			var reg_content = /\"ershoufang\" >(.*)<\/div>/
			var reg_zone = /<a\shref=\"\/ershoufang\/(.\w)\/\"/;
			var zone_id = reg_content.exec(body);

			console.log(zone_id);
		});
		// Do stuff with response
	});
}

var getLianjia = function(city, zone, page, rooms, zhuangxiu, key, callback) {
	var curPage = page;
	if (page == 1) {
		curPage = '';
	} else {
		curPage = page;
	}
	if (!rooms) {
		var cur_rooms = '';
	} else {
		var cur_rooms = 'l' + rooms;
	}
	if (!zhuangxiu) {
		zhuangxiu = '';
	}

	var req = http.get({
		hostname: 'm.lianjia.com',
		port: 80,
		path: '/' + city + '/ershoufang/' + zone + '/' + cur_rooms + zhuangxiu + 'pg' + curPage + '?_t=1',
		agent: false // create a new agent just for this one request
	}, (res) => {
		var content = '';
		var do_timeout = false;
		var req_timeout = setTimeout(function() {
			do_timeout = true;
			console.log('time out and retry');
			getLianjia(city, zone, page, rooms, zhuangxiu, key, callback);
		}, 5000);
		res.on('data', function(chunk) {
			content += chunk;
		});

		res.on('error', function() {
			if (do_timeout) {
				return;
			}
			clearTimeout(req_timeout);
			console.log('network error and retry');
			getLianjia(city, zone, page, rooms, zhuangxiu, key, callback);
		});

		res.on('end', function(chunk) {
			if (do_timeout) {
				return;
			}
			clearTimeout(req_timeout);
			content += chunk;
			var body = content;
			var http_res = doMatch(body);

			if (http_res !== 'end') {
				console.log('request: ' + '地区：' + zone + page);
				getLianjia(city, zone, ++page, rooms, zhuangxiu, key, callback);
			} else {
				var text = '';
				if (rooms) {
					text = rooms + '居 ';
				}
				if (zhuangxiu) {
					text = text + '精装修 ';
				}

				//文字描述
				var allText = text + '均价:' + getUnitPrice();
				allText += ' 在售套数:' + res_array.length;
				allText += ' 平均总价:' + getPrice();
				allText += ' 平均面积:' + getSize();
				file_desc.push(allText);
				if (!res_array.length) {
					res_array = [];
					callback();
					return;
				}
				//写入文件的数据
				file_json[key] = {
					num: res_array.length,
					unit_price: getUnitPrice(),
					max_unit_price: getMaxUnitPrice(),
					min_unit_price: getMinUnitPrice(),
					price: getPrice(),
					maxPrice: getMaxPrice(),
					minPrice: getMinPrice(),
					size: getSize(),
					minSize: getMinSize(),
					maxSize: getMaxSize(),
					rooms: rooms,
					decoration: zhuangxiu
				}
				if (callback) {
					res_array = [];
					callback();
				}
			}
		});
		// Do stuff with response
	});
}

var log_info = function(zone) {
	var dir = './data/' + zone + '/';
	file_json['summary'] = file_desc.join(',');

	fs.exists(dir, (exists) => {
		if (!exists) {
			fs.mkdirSync(dir);
		}
		var content = fs.writeFileSync('./data/' + zone + '/' + cur_date + '.json', JSON.stringify(file_json), 'utf-8');
	});

}
var getALLInfo = function(city, zone, callback) {
	var key_prefix = zone;
	if (key_prefix == 'dayuan') {
		key_prefix = 'dy';
	}
	getLianjia(city, zone, 1, 0, false, key_prefix + '_all', function() {
		getLianjia(city, zone, 1, 1, false, key_prefix + '_1', function() {
			getLianjia(city, zone, 1, 2, false, key_prefix + '_2', function() {
				getLianjia(city, zone, 1, 3, false, key_prefix + '_3', function() {
					getLianjia(city, zone, 1, 4, false, key_prefix + '_4', function() {
						getLianjia(city, zone, 1, 1, 'de1', key_prefix + '_1_de1', function() {
							getLianjia(city, zone, 1, 2, 'de1', key_prefix + '_2_de1', function() {
								getLianjia(city, zone, 1, 3, 'de1', key_prefix + '_3_de1', function() {
									getLianjia(city, zone, 1, 4, 'de1', key_prefix + '_4_de1', function() {
										log_info(city + '/' + key_prefix);
										callback && callback();
									});
								});
							});
						});
					});
				});
			});
		});
	});
}


var doCrawl = function(city, index, callback) {
	if (!index) {
		index = 0;
	}
	var config = require('./config.js').data[city];
	var zone = config[index];
	if (zone) {
		var dir_zone = zone;
		if (zone == 'dayuan') {
			dir_zone = 'dy';
		}
		fs.exists('./data/' + city + '/' + dir_zone + '/' + cur_date + '.json', (exists) => {
			if (exists) {
				console.log(zone + 'pass!has crawled!');
				doCrawl(city, ++index, callback);
			} else {
				console.log(zone)
				getALLInfo(city, zone, function() {
					doCrawl(city, ++index, callback);
				});
			}

		});
	} else {
		callback && callback();
	}

}
function crawLinkCD() {
	var res = [];
	var a = $($('.option-list.sub-option-list')[0]).find('a');
	for (var i = 0; i < a.length; i++) {
		res.push($(a[i]).attr('href').split('/')[2]);
	};
	return JSON.stringify(res);
}
function crawlLinkBJ() {
	var res = [];
	var a = $($($($('.position')[0]).find('[data-role="ershoufang"]')[0]).find('div')[1]).find('a');
	for (var i = 0; i < a.length; i++) {
		res.push($(a[i]).attr('href').split('/')[2]);
	};
	return JSON.stringify(res);
}
//getLianjiaZone('bj')
//
doCrawl('cd', 0, function() {
	doCrawl('bj');
});