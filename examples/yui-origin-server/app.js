/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'), // modown-yui
    app     = express();

app.configure('development', function () {
    // when using `app.yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.yui.debugMode();
});

app.yui.serveCoreFromAppOrigin();

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