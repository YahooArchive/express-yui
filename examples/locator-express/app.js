/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    // modown-yui
    yui = require('../../'),
    // creating app
    app = express(),
    // modown-locator
    locator = new (require('modown-locator'))({
        buildDirectory: 'build'
    });

locator.plug(require('modown-handlebars').plugin())
    .plug(require('modown-micro').plugin())
    .plug(app.yui.plugin({
        register: true,
        attach: true
    }))
    .parseBundle(__dirname, {}).then(function (have) {

        app.set('view', app.yui.view({
            defaultBundle: 'locator-express',
            defaultLayout: 'index'
        }));

        app.yui.debugMode();
        app.yui.serveCoreFromAppOrigin();
        // TODO: add support for *
        app.yui.serveGroupFromAppOrigin('locator-express', {
            // any special loader configuration for all groups
        });

        // serving static yui modules
        app.use(yui['static']({
            maxAge: 100
        }));

        // creating a page with YUI embeded
        app.get('/bar', yui.expose(), function (req, res, next) {
            res.render('bar', {
                tagline: 'testing with some data for template bar',
                tellme: 'but miami is awesome!'
            });
        });

        // creating a page with YUI embeded
        app.get('/foo', yui.expose(), function (req, res, next) {
            res.render('foo', {
                tagline: 'testing some data for template foo',
                tellme: 'san francisco is nice!'
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