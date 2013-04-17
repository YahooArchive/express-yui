/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    // modown components
    yui           = require('../../'), // modown-yui
    BundleLocator = require('modown-locator'),
    handlebars    = require('modown-handlebars'),
    // getting app ready
    app     = express(),
    locator = new BundleLocator({
        buildDirectory: 'build'
    });

yui({
    "allowRollup" : false
}, __dirname + '/node_modules/yui');

locator.plug({
    extensions: ['handlebars']
}, handlebars.plugin);

locator.plug({
    types: ['*']
}, yui.locatorLoader({
    register: true,
    attach: true
}));

locator.parseBundle(__dirname, {}).then(function (have) {

    app.use(yui.debugMode());

    app.use(yui.serveCoreFromAppOrigin());

    // we can get all groups from the app origin.
    // TODO: add support for *
    app.use(yui.serveGroupFromAppOrigin('locator-express', {
        // any special loader configuration for all groups
    }));

    // template engine
    app.engine('handlebars', yui.engine({ defaultBundle: 'locator-express' }));
    app.set('view engine', 'handlebars');
    app.set('views', __dirname + '/templates');

    // creating a page with YUI embeded
    app.get('/', yui.expose(), function (req, res, next) {
        res.render('bar', {
            something: 'it works'
        });
    });

    // listening
    app.set('port', process.env.PORT || 8666);
    app.listen(app.get('port'), function () {
        console.log("Server listening on port " +
            app.get('port') + " in " + app.get('env') + " mode");
    });

}, function () {

    console.log('error: ', arguments);

});