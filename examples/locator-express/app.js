/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    // express-yui
    yui = require('../../'),
    // creating app
    app = express(),
    // modown-locator
    locator;

app.set('view', app.yui.view({
    defaultBundle: 'locator-express',
    defaultLayout: 'index'
}));
app.set('port', process.env.PORT || 8666);

app.yui.debugMode();
app.yui.setCoreFromAppOrigin();

// serving static yui modules
app.use(yui['static']());

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

// locator initialiation
locator = new (require('locator'))({
    buildDirectory: 'build'
});

locator.plug(require('locator-handlebars').yui())
    .plug(require('locator-micro').yui())
    .plug(app.yui.plugin({
        registerGroup: true,
        registerServerModules: true,
        useServerModules: true
    }))
    .parseBundle(__dirname, {}).then(function (have) {

        // listening for traffic only after locator finishes the walking process
        app.listen(app.get('port'), function () {
            console.log("Server listening on port " +
                app.get('port') + " in " + app.get('env') + " mode");
        });

    }, function () {
        console.log('error: ', arguments);
    });