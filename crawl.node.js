var http = require('http');
var fs = require('fs');
var body;
var res_array = [];
var file_json = {};
var file_desc = [];
var reg_price = /span class\=\"price_total\">(.+)<\/span>/;
var reg_unit_price = /span class\=\"unit_price\">(.+)<\/span>/;
var doMatch = function(text) {
	var price = reg_price.exec(text);
	var unit_price = reg_unit_price.exec(text);
	if (price && price.length) {
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

var getLianjia = function(zone, page, rooms, zhuangxiu, key, callback) {
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
		path: '/cd/ershoufang/'+ zone +'/' + cur_rooms + zhuangxiu + 'pg' + curPage + '?_t=1',
		agent: false // create a new agent just for this one request
	}, (res) => {
		var content = '';
		res.on('data', function(chunk) {
			content += chunk;
		});

		res.on('end', function(chunk) {
			content += chunk;
			var body = content;
			var http_res = doMatch(body);

			if (http_res !== 'end') {
				console.log('request ' + page);
				getLianjia(zone,++page, rooms, zhuangxiu, key, callback);
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
	var dir = './data/'+ zone + '/';
	file_json['summary'] = file_desc.join(',');

	fs.exists(dir, (exists) => {
	  if(!exists){
	  	fs.mkdirSync(dir);
	  }
	  var content = fs.writeFileSync('./data/'+ zone + '/' + cur_date + '.json', JSON.stringify(file_json), 'utf-8');
	});
	
}
var getALLInfo = function(zone,callback) {
		getLianjia(zone,1, 0, false, zone + '_all', function() {
			getLianjia(zone,1, 1, false, zone + '_1', function() {
				getLianjia(zone,1, 2, false, zone + '_2', function() {
					getLianjia(zone,1, 3, false, zone + '_3', function() {
						getLianjia(zone,1, 4, false, zone + '_4', function() {
							getLianjia(zone,1, 1, 'de1', zone + '_1_de1', function() {
								getLianjia(zone,1, 2, 'de1', zone + '_2_de1', function() {
									getLianjia(zone,1, 3, 'de1', zone + '_3_de1', function() {
										getLianjia(zone,1, 4, 'de1', zone + '_4_de1', function() {
											log_info('cd/' + zone);
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

getALLInfo('dy',function(){
getALLInfo('jinrongcheng',function(){
getALLInfo('xinhuizhan',function(){
	
});
});
});


