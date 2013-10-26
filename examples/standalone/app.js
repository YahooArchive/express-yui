/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    expyui  = require('../../'), // express-yui
    app     = express();

expyui.extend(app);

// by default, the seed will be just `yui` module, but we can
// extend the list by adding more modules to the seed list
// to speed up the booting process
app.yui.seed(['yui', 'json-stringify']);

app.configure('development', function () {

    // In development, we can get YUI from app origin
    // to facilitate development.
    app.yui.setCoreFromAppOrigin();

});

app.configure('production', function () {

    // In production, get YUI from CDN.
    app.yui.setCoreFromCDN();

    // In production, get group1 modules from
    // CDN providing the custom configuration for
    // github raw for example:
    app.yui.applyGroupConfig('group1', {
        combine: false,
        base: 'https://rawgithub.com/yui/yui3/master/build/'
    });
    // while still use the app origin for group2, but with a custom setting
    app.yui.applyGroupConfig('group2', {
        combine: false
    });

});

// registering groups
app.yui.registerGroup('group1', './build/group1', 'loader-group1');
app.yui.registerGroup('group2', './build/group2', 'loader-group2');

// template engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// serving static yui modules
app.use(expyui['static'](__dirname + '/build', {
    maxAge: 100
}));

// creating a page with YUI embeded
app.get('/', expyui.expose(), function (req, res, next) {
    res.render('page');
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
