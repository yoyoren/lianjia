var koa = require('koa');
var controller = require('koa-route');
var app = koa();

var views = require('co-views')
var render = views('./view', {
  map: { html: 'ejs' }
});
var koa_static = require('koa-static-server');
var service = require('./service/webAppService.js');
app.use(koa_static({
	rootDir: './static/',
	rootPath: '/static/',
	maxage: 0
}));
var querystring = require('querystring')
app.use(controller.get('/', function*(){
	this.set('Cache-Control', 'no-cache');
	var params = querystring.parse(this.req._parsedUrl.query);
	var city = params.city || 'cd';
	var zone = params.zone || 'dy';
	var configData = require('./config.js');
	configData = configData.data;
	this.body = yield render('index',{
		city:city,
		zone:zone,
		configData:configData
	});
}));

app.use(controller.get('/ajax/get_by_month', function*(){
	this.set('Cache-Control', 'no-cache');
	var params = querystring.parse(this.req._parsedUrl.query);
	var city = params.city || 'cd';
	var zone = params.zone || 'dy';
	this.body = service.get_by_month({city:city,zone:zone});
}));




app.listen(3002);