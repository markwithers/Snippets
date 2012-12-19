var express = require('express')
var app = express()
var server = app.listen(process.env.PORT || 3000)

var io = require('socket.io').listen(server)

var logger = require('./log_manager').getLogger()
var notifications = require('./notifications.js')

app.configure(function() {
    app.set('views', __dirname + '/views')
    app.set('view engine', 'jade')
    app.use(express.bodyParser())
    app.use(express.methodOverride())
    app.use(express.cookieParser())
    app.use(express.static(__dirname + '/public'))
    app.use(app.router)
})

app.get('/GetCount/:userName/:application', function (req, res) {
	notifications.getUnreadCount(req.params.userName, req.params.application, function(data){
		res.send(data)
	})
})

app.get('/GetHistory/:userName/:application', function(req, res){
	notifications.getHistory(req.params.userName, req.params.application, function(data){
		res.send(data)
	})
})

app.get('/MarkAsRead/:userName/:application', function(req, res){
	res.send({done: true})
	notifications.markAsRead(req.params.userName, req.params.application, io)
})

app.post('/Message', function(req, res){
	res.send({done: true})
	notifications.insertNotification(req)
})

app.get('/Test/:userName/:application', function(req, res) {
	res.send({done: true})
	io.of('/' + req.params.application).emit(req.params.userName, { message: 'Test Message', clearCount: false })
})

io.of('/Moose')
io.of('/Moscow')

setInterval(function(){
	notifications.checkNotifications(io)
}, 5000)

process.on('uncaughtException', function (err) {
  logger.error('crash error - ' + err)
})