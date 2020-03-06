const express = require('express');
const vhost = require('vhost');

// const cleanhouse = require('../cleanhouse_beta/bin/www');
// const parking = require('../test-smart-parking/app');

const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const favicon = require('serve-favicon');
const fs = require('fs');
require('dotenv').config();

const pageRouter = require('./routes/index');
const app = express();
// app.use(vhost('cleanhouse.deep-find.com', cleanhouse));

// Secure Settings
const https = require('https');
const http = require('http');
const options = {
  key: fs.readFileSync('key/privkey.pem'),
  cert: fs.readFileSync('key/cert.pem')
};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(path.join(__dirname, 'public/img', 'favicon.ico')));

// app.use(morgan('dev'));
app.use(expressLayouts);
// app.use(vhost('parking.deep-find.com', parking));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
}));

app.use('/', pageRouter);
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;                                                                                                                                                                                                                          
});

app.use((err, req, res) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

var port1 = 3003;
var port2 = 3004;

// Create an HTTPS service identical to the HTTP service.
https.createServer(options, app).listen(port2, function() {
  console.log("Https server listening on port " + port2);
});

// Create an HTTP service.
http.createServer(function(req, res) {
  console.log("Http server listening on port " + port1);
  res.writeHead(301, {
    "Location": "https://" + req.headers['host'] + req.url
  });
  res.end();
}).listen(port1);

// var cleanhouseSite = express.createServer(),
//   smartparkingSite = express.createServer(),
//   site_vhosts = [],
//   vhost;;
//
// site_vhosts.push(express.vhost('cleanhouse.deep-find.com', cleanhouseSite));
// site_vhosts.push(express.vhost('parking.deep-find.com', smartparkingSite));
//
// vhost = express.createServer.apply(this, site_vhosts);
// cleanhouseSite.listen(3005);
// smartparkingSite.listen(3002);

// app.listen(app.get('port'), () =>{
//   console.log(app.get('port'), '번 포트에서 대기 중');
// });

// https.createServer(lex.httpsOptions, lex.middleware(app)).listen(process.env.SSL_PORT || 3008);

module.exports = app;
