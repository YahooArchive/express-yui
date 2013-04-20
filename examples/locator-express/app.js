/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    // modown components
    yui = require('../../'), // modown-yui
    BundleLocator = require('modown-locator'),
    // getting app ready
    app = express(),
    locator;

yui({
    "allowRollup" : false
}, __dirname + '/node_modules/yui/debug');

locator = new BundleLocator({
    buildDirectory: 'build'
});

locator.plug({
    extensions: ['handlebars']
}, require('modown-handlebars').plugin);

locator.plug({
    extensions: ['micro']
}, require('modown-micro').plugin);

locator.plug({
    types: ['*']
}, yui.locatorLoader({
    register: true,
    attach: true
}));

locator.parseBundle(__dirname, {}).then(function (have) {

    app.set('view', yui.view({ defaultBundle: 'locator-express' }));

    app.use(yui.debugMode());

    app.use(yui.serveCoreFromAppOrigin());

    // we can get all groups from the app origin.
    // TODO: add support for *
    app.use(yui.serveGroupFromAppOrigin('locator-express', {
        // any special loader configuration for all groups
    }));

    // creating a page with YUI embeded
    app.get('/bar', yui.expose(), function (req, res, next) {
        res.render('bar', {
            tagline: 'testing with some data for template bar'
        });
    });

    // creating a page with YUI embeded
    app.get('/foo', yui.expose(), function (req, res, next) {
        res.render('foo', {
            tagline: 'testing some data for template foo'
        });
    });

    // watching the source folder for live changes
    locator.watch(__dirname);

    // listening
    app.set('port', process.env.PORT || 8666);
    app.listen(app.get('port'), function () {
        console.log("Server listening on port " +
            app.get('port') + " in " + app.get('env') + " mode");
    });

}, function () {

    console.log('error: ', arguments);

});