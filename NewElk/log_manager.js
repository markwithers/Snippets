var Log = require('log')
  , fs = require('fs')
  , stream = fs.createWriteStream(__dirname + '/file.log', { flags: 'a' })
  , logger = new Log('debug', stream);
  
module.exports.getLogger = function(){
	return logger;
}