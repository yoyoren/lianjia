var http = require('http');
var fs = require('fs');
var myCookie = fs.readFileSync('cookie.config', 'utf-8');
var reg_image = /<img class\=\"photo_pict\" src=\"(.+)\"\/>/
var reg_since_id = /since_id=(.+)\">/
	//var reg_image = /span class\=\"price_total\"><em><\/em>/;
var res_array = [];
var getSinceId = function(text){
	var id = reg_since_id.exec(text);
	if(!id){
		return null;
	}
	return id[1];
}

var doMatch = function(text) {
	var image = reg_image.exec(text);
	//var unit_price = reg_unit_price.exec(text);
	if (image) {
		image_pic = image[1];
		image_pic = image_pic.replace('thumb300', 'large');
		res_array.push(image_pic);
		text = text.replace(image[0], '');
		doMatch(text);
	} else {
		return 'end';
	}
}
var downLoadOneFile = function(id){
    var content = fs.readFileSync('./weibo_data/' + id + '.json', 'utf-8');
    content = JSON.parse(content);
    var dir = './weibo_image/'+ id + '/';
	fs.exists(dir, (exists) => {
	  if(!exists){
	  	fs.mkdirSync(dir);
	  }
	  imageDownload(id,content);
	});
    
}
var imageDownload = function(id,data,index) {
	if(!index){
		index = 0;
	}

	if(!data[index]){
		return;
	}

	var url = data[index];
	var name = url.split('/').pop();
	
	http.get(url, function(res) {
		var imgData = "";
		var retry = false;
		var download_timeout = setTimeout(function(){
			retry = true;
			imageDownload(id,data, index);
			console.log('download timeout!');
		}, 12000);

		res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
		res.on("data", function(chunk) {
			imgData += chunk;
		});

		res.on("error", function(chunk) {
			if(retry){
			   return;
			}
			imageDownload(id,data, index);
		});

		res.on("end", function() {
			if(retry){
			   return;
			}
			clearTimeout(download_timeout);
			fs.writeFile("./weibo_image/"+ id + "/"+ name +".png", imgData, "binary", function(err) {
				if (err) {
					console.log("down fail");
				}
				console.log("down success " + name);
				console.log(index + " / " + data.length);
				imageDownload(id,data,++index);
			});
		});
	});
}


var doCrawl = function(owner_uid,page_id,page,sinceId,callback) {
	var req = http.get({
		hostname: 'weibo.com',
		port: 80,
		path: '/p/aj/album/loading?since_id='+ sinceId +'&ajwvr=6&type=photo&owner_uid=' + owner_uid + '&page_id=' + page_id + '&page=' + page + '&ajax_call=1&__rnd=1478072986959',
		agent: false,
		headers: {
			'Cookie': myCookie,
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36'
		} // create a new agent just for this one request
	}, (res) => {
		var content = '';
		var retry = false;
		var crawl_timeout = setTimeout(function(){
			retry = true;
			doCrawl(owner_uid,page_id,page,sinceId);
			console.log('crawl timeout!');
		}, 5000);
		res.on('data', function(chunk) {
			content += chunk;
			//console.log(chunk);
		});

		res.on('error', function() {
			clearTimeout(crawl_timeout);
			doCrawl(owner_uid,page_id,page,sinceId);
		});

		res.on('end', function(chunk) {
			clearTimeout(crawl_timeout);
			
			if(retry){
			   return;
			}

			if (chunk) {
				content += chunk;
			}
			content = JSON.parse(content);
			content = content.data;
			//console.log(content);
			var sinceId = getSinceId(content);
			if(sinceId){
				console.log(page);
				doMatch(content);
				doCrawl(owner_uid,page_id,++page,sinceId,callback);
			}else{
				fs.writeFileSync('./weibo_data/'+ owner_uid + '.json', JSON.stringify(res_array), 'utf-8');
				console.log('done');
				callback && callback();
			}
			
		});
	});
}
var owner_uid = '5230466807';
var page_id = '1004065230466807'

doCrawl(owner_uid,page_id,0,'',function(){
	downLoadOneFile(owner_uid);
});



