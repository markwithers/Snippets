var express = require('express')
var app = express()
var server = app.listen(process.env.PORT || 3000)

var redis = require('redis')

app.configure(function() {
    app.use(express.bodyParser())
    app.use(express.methodOverride())
    app.use(express.cookieParser())
    app.use(express.static(__dirname + '/public'))
    app.use(app.router)
})

app.get('/Email/:id', function(req, res){
	var client = redis.createClient('6379', '10.20.28.161')
	
	client.on("error", function (err) {
        console.log("Error " + err)
    })

    client.lindex(['rejected-case-emails', req.params.id], function (err, result) {	
        res.send(result)
        client.quit()
    })
})

app.get('/Emails', function(req, res){
	var client = redis.createClient('6379', '10.20.28.161')
	
	client.on("error", function (err) {
        console.log("Error " + err)
    })

    client.lrange(['rejected-case-emails', 0, -1], function (err, result) {
		var tos = result.map(function(e){ 
			var email = JSON.parse(e)
			return email.To + email.From + email.Subject
		})

        res.send(tos)
        client.quit()
    })
})

app.get('/Clients', function(req, res){
	var client = redis.createClient('6379', '10.20.28.161')
	
	client.on("error", function (err) {
        console.log("Error " + err)
    })
	
	client.lrange(['clients', 0, -1], function (err, result) {
		var tos = result.map(function(e){ 
			var client = JSON.parse(e)
			if (client.CountryId == 222){
				return client
			}
		}).filter(function(e){return e})

        res.send(tos)
        client.quit()
    })
})

process.on('uncaughtException', function (err) {
	console.log('crash error - ' + err)
})