var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var flash = require('connect-flash');

var settings = require('./settings');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//片段视图
var partials = require('express-partials');
app.use(partials());

// 访问日志
var fs = require('fs');
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});
var morgan = require('morgan');
app.use(morgan('combined', {stream: accessLogStream}));
var errorLogStream = fs.createWriteStream(__dirname + '/error.log', {flags: 'a'});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

// 会话支持
app.use(session({
    secret: settings.cookieSecret,
    store: new MongoStore({
      url: 'mongodb://localhost/' + settings.db
    })
  }));

// 视图交互
app.use(function(req, res, next) {
      res.locals.user = req.session.user;
      res.locals.post = req.session.post;
      var error = req.flash('error');
      res.locals.error = error.length ? error : null;

      var success = req.flash('success');
      res.locals.success = success.length ? success : null;
      next();
    });

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    // 写入错误日志
    var meta = '[' + new Date() + '] ' + req.url + '\n';
    errorLogStream.write(meta + err.stack + '\n');

    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
