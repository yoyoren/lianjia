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

app.use(controller.get('/', function*(){
	this.set('Cache-Control', 'no-cache');
	this.body = yield render('index');
}));

app.use(controller.get('/ajax/get_by_month', function*(){
	this.set('Cache-Control', 'no-cache');
	this.body = service.get_by_month();
}));




app.listen(3002);