/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'), // modown-yui
    app     = express();

// by default, the seed will be just `yui`, but we can
// extend the list by adding more modules to the seed list
// to speed up the booting process
app.yui.seed(['yui', 'json-stringify']);

// registering groups
app.yui.registerGroup('group1', './build-group1');
app.yui.registerGroup('group2', './build-group2');

app.configure('development', function () {

    // when using `app.yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.yui.debugMode();

    // In development, we can get YUI from app origin
    // to facilitate development.
    app.use(app.yui.serveCoreFromAppOrigin());

    // In development, we can get app modules from
    // the app origin to facilitate development.
    app.use(app.yui.serveGroupFromAppOrigin('group1'));
    app.use(app.yui.serveGroupFromAppOrigin('group2'));

});

app.configure('production', function () {

    // In production, we can get YUI from CDN.
    app.use(app.yui.serveCoreFromCDN());

    // In production, we can get app modules from
    // CDN providing the custom configuration for
    // github raw for example:
    app.use(app.yui.serveGroupFromCDN('group1', {
        combine: false,
        base: 'https://rawgithub.com/yui/yui3/master/build/'
    }));
    app.use(app.yui.serveGroupFromAppOrigin('group2'));

});

// template engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// creating a page with YUI embeded
app.get('/', app.yui.expose(), function (req, res, next) {
    res.render('page');
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
