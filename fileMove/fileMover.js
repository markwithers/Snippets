var fs = require('fs'),
	sourcePath = 'C:/dev/fileMove/in/', // use real path here (include trailing slash - use forward slashes)
	destinationPath = 'C:/dev/fileMove/out/' // .. and here
	
console.log('service started');
setInterval(function(){
	var files = fs.readdirSync(sourcePath);
	
	for (var f in files){
		moveFile(sourcePath + files[f], destinationPath + files[f]);
	}
}, 250);
	
function moveFile(source, destination){
	var sourceFile = fs.createReadStream(source)
	var destinFile = fs.createWriteStream(destination);

	sourceFile.pipe(destinFile);
	sourceFile.on('end', function(){
		fs.unlinkSync(source);
		console.log(source + ' - moved');
	});
}