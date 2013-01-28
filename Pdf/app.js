var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/pdf', function(req, res){
	var PdfDoc = require('pdfkit');
	var doc = new PdfDoc();
	
	doc.info.Title = 'Test Doc';
	doc.info.Author = 'Mark Withers';
	
	doc.fontSize(10);
	doc.font('arial.ttf');
	
	doc.image('tr-logo.png', 460, 50, { fit: [100, 100] });
	
	doc.text('Our ref: HJ/056728', 0, 170);
	doc.moveDown();
	doc.text('8 January 2013 ');
	doc.moveDown();
	doc.text('Miss Elise Mason');
	doc.text('Green Wright Chalton Annis');
	doc.text('DX 55100');
	doc.text('RUSTINGTON');
	doc.moveDown();
	doc.moveDown();
	doc.text('Dear Miss Mason');
	doc.moveDown();
	doc.text('Barbara Kathleen Milroy (Deceased)');
	doc.moveDown();
	doc.text('Thank you for your letter/fax/e-mail dated 1 May 2009.');
	doc.text('Hi Joey');
	
	doc.output(function(pdf){
		res.type('application/pdf');
		res.end(pdf, 'binary');
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
