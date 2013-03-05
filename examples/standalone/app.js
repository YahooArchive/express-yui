/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'),
    app     = express();

// you can use a custom version of YUI by
// specifying a custom path as a second argument,
// or by installing yui at the app level using npm.
// in this example we are using the yui from
// npm's devDependencies.
yui({
    "allowRollup" : false
}, __dirname + '/../../node_modules/yui');

// by default, the seed will be just `yui-base`, but we can
// extend the list by adding more modules to the seed list
// to speed up the booting process
app.use(yui.seed(['yui-base', 'loader']));

app.configure('development', function () {

    // when using `yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.use(yui.debugMode());

    // In development, we can get YUI from app origin
    // to facilitate development.
    app.use(yui.serveCoreFromAppOrigin());

    // In development, we can get app modules from
    // the app origin to facilitate development.
    app.use(yui.serveGroupFromAppOrigin('path/app-modules-meta.js', {}));

});

app.configure('production', function () {

    // In production, we can get YUI from CDN.
    app.use(yui.serveCoreFromCDN());

    // In production, we can get app modules from
    // CDN providing the custom configuration for
    // github raw for example:
    app.use(yui.serveGroupFromCDN('path/app-modules-meta.js', {
        combine: false,
        base: 'https://rawgithub.com/yui/yui3/master/build/'
    }));

});

// template engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

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
