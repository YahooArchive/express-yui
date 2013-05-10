/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'), // modown-yui
    app     = express();

// by default, the seed will be just `yui-base`, but we can
// extend the list by adding more modules to the seed list
// to speed up the booting process
app.yui.seed(['yui-base', 'loader']);

app.configure('development', function () {
    // when using `app.yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.yui.debugMode();
});

// normally, production is the default configuration,
// but here is an example of forcing to use CDN
// for yui core modules with a custom root folder
app.yui.setCoreFromCDN({
    root: app.yui.version + "/build/"
});

// template engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// serving static yui modules
app.use(yui['static']({
    maxAge: 100
}));

// creating a page with YUI embeded
app.get('/', yui.expose(), function (req, res, next) {
    res.render('page');
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
