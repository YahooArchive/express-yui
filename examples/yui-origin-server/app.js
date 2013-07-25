/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'), // express-yui
    app     = express();

app.configure('development', function () {
    // when using `app.yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly at the app level.
    // In this case, `raw` version instead of `debug`.
    app.yui.debugMode({ filter: 'raw' });
});

app.yui.setCoreFromAppOrigin();

// template engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// serving static yui modules
app.use(yui['static']({
    maxAge: 100
}));

// exposing yui into the client side for all requests
app.use(yui.expose());

// using debug when a querystring `?debug=1` is passed
app.use(function(req, res, next) {
    if (req.query.debug) {
        yui.debug()(req, res, next);
    } else {
        next();
    }
});

// creating a page with YUI embeded
app.get('/', function (req, res, next) {
    res.render('page');
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
