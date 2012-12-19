var db = require('./db.js')
var TYPES = require('tedious').TYPES
var logger = require('./log_manager').getLogger()
var moment = require('moment')

module.exports.checkNotifications = function(io){
	var connection = db.createConnection()

	db.connect(connection, function () {
		var sql = 	'SELECT TOP 100 * ' +
					'FROM Elk.Elk.[Notification] ' + 
					'WHERE DateTimeBroadcast IS NULL'
	
		var request = db.getRequest(connection, sql)

		request.on('row', function(columns){
			var row = db.getRow(columns)
			
			module.exports.writeBackBroadcastTime(row)
			
			logger.debug('Sending - ' + row.NotificationId)
			io.of('/' + row.Application).emit(row.Username, { message: row.Message, clearCount: false })
		})

		connection.execSql(request)
	})
}

module.exports.writeBackBroadcastTime = function(row){	
	var connection = db.createConnection()

	db.connect(connection, function () {
		logger.debug('Marked as sent - ' + row.NotificationId)
	
		var sql = 	'UPDATE Elk.Elk.[Notification] ' +
					'SET DateTimeBroadcast = @Date ' +
					'WHERE NotificationId = @NotificationId'
		
		var request = db.getRequest(connection, sql)
		
		request.addParameter('NotificationId', TYPES.Int, row.NotificationId)
		request.addParameter('Date', TYPES.DateTime, new Date())
		
		connection.execSql(request)
	})
}

module.exports.insertNotification = function(req){
	var connection = db.createConnection()

	db.connect(connection, function () {
		var sql = 	'INSERT INTO Elk.Elk.[Notification] ' +
					'(Username, [Message], [Application], DateTimeBroadcast) ' +
					'SELECT @User, @Message, @Application, NULL'
		
		var request = db.getRequest(connection, sql)
		
		request.addParameter('User', TYPES.VarChar, req.body.user)
		request.addParameter('Message', TYPES.VarChar, req.body.message)
		request.addParameter('Application', TYPES.VarChar, req.body.application)
			
		connection.execSql(request)
	})
}

module.exports.getHistory = function(userName, application, callback){
	var connection = db.createConnection()

	db.connect(connection, function () {
		var sql = 	"SELECT TOP 10 Message, DateTimeBroadcast " +
					"FROM Elk.Elk.[Notification] " + 
					"WHERE (Username = @Username OR Username = 'all') " + 
					"AND DateTimeBroadcast IS NOT NULL " +
					"AND Application = @Application " +
					"ORDER BY DateTimeBroadcast DESC "
		
		var request = db.getRequest(connection, sql, function(rows){
			module.exports.getLastRead(userName, application, function(lastRead){
				if (lastRead != null){
					rows = rows.map(function(row){
						return {
							message: row.Message,
							fresh: lastRead < row.DateTimeBroadcast,
							timeago: moment(row.DateTimeBroadcast).fromNow()
						}
					})
				}
			
				callback(rows)
			})
		})
		
		request.addParameter('Username', TYPES.VarChar, userName)
		request.addParameter('Application', TYPES.VarChar, application)
		
		connection.execSql(request)
	})
}

module.exports.getUnreadCount = function(userName, application, callback){
	module.exports.getLastRead(userName, application, function(lastRead){
		if (lastRead == null){
			lastRead = new Date()
			module.exports.markAsRead(userName, application)
		}

		module.exports.getUnreadCountByDate(userName, application, lastRead, callback)
	})
}

module.exports.markAsRead = function(userName, application, io){
	module.exports.getLastRead(userName, application, function(lastRead){
		var connection = db.createConnection()

		db.connect(connection, function () {	
			var sql = ''
			if (lastRead){
				sql = 	'UPDATE Elk.Elk.[NotificationUserHistory] ' +
						'SET LastRead = @LastRead ' +
						'WHERE Username = @Username ' +
						'AND Application = @Application '
			}
			else {
				sql = 	'INSERT INTO Elk.Elk.[NotificationUserHistory] ' +
						'(Username, Application, LastRead) ' +
						' SELECT @Username, @Application, @LastRead' 
			}
			
			var request = db.getRequest(connection, sql)
			
			request.addParameter('Username', TYPES.VarChar, userName)
			request.addParameter('Application', TYPES.VarChar, application)
			request.addParameter('LastRead', TYPES.DateTime, new Date())
			
			connection.execSql(request)

			if (io) {
				io.of('/' +application).emit(userName, { message: 'blank', clearCount: true })
			}
		})
	})
}

module.exports.getUnreadCountByDate = function(userName, application, lastRead, callback){
	var connection = db.createConnection()

	db.connect(connection, function () {
		var sql = 	"SELECT COUNT(*) AS Count " +
					"FROM Elk.Elk.[Notification] " + 
					"WHERE (Username = @Username OR Username = 'all') " +
					"AND Application = @Application " +
					"AND DateTimeBroadcast >= @LastRead "
		
		var request = db.getRequest(connection, sql, function(){
			if (callback){
				callback(request.rows[0])
			}
		})
		
		request.addParameter('Username', TYPES.VarChar, userName)
		request.addParameter('Application', TYPES.VarChar, application)
		request.addParameter('LastRead', TYPES.DateTime, lastRead)
		
		connection.execSql(request)
	})
}

module.exports.getLastRead = function(userName, application, callback){
	var connection = db.createConnection()

	db.connect(connection, function () {
		var sql = 	'SELECT * FROM Elk.Elk.[NotificationUserHistory] ' +
					'WHERE Username = @Username ' +
					'AND Application = @Application '
		
		var request = db.getRequest(connection, sql, function(){
			if (callback){
				if (request.rows.length == 0){
					callback(null)
				}
				else{
					callback(request.rows[0].LastRead)
				}
			}
		})
		
		request.addParameter('Username', TYPES.VarChar, userName)
		request.addParameter('Application', TYPES.VarChar, application)
		
		connection.execSql(request)
	})
}