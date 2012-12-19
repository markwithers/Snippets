var logger = require('./log_manager').getLogger()

module.exports.createConnection = function(){
	var Connection = require('tedious').Connection
	
	var config = {
		server: 'REDACTED',
		userName: 'REDACTED',
		password: 'REDACTED'
	}

	var connection = new Connection(config)

	return connection
}
	
module.exports.connect = function(connection, callback){
	connection.on('connect', function(err) {
		if (err){
			console.log(err)
			logger.error(err)
		}
		else {
			callback()
		}
	})
}
	
module.exports.getRequest = function(connection, sql, callback){
	var Request = require('tedious').Request

	var request = new Request(sql, function(err, rowCount) {				
		if (err) {
			console.log(err)
			logger.error(err)
		}
		
		if (callback){
			callback(request.rows)
		}
		
		connection.close()
	})
	
	request.rows = []
	module.exports.registerRowFiller(request)
	
	return request
}

module.exports.getRow = function(columns){
	var row = {}
	columns.forEach(function(column) { 
		if (column.isNull) { 
		  row[column.metadata.colName] = null 
		} else { 
		  row[column.metadata.colName] = column.value 
		} 
	})
	
	return row
}

module.exports.registerRowFiller = function(request) {
	request.on('row', function(columns) {
		var row = module.exports.getRow(columns)
		request.rows.push(row)
	})
}