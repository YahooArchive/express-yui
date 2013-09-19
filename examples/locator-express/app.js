/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    expyui = require('../../'), // express-yui
    expview = require('express-view'),
    Locator = require('locator'),
    LocatorHandlebars = require('locator-handlebars'),
    LocatorMicro = require('locator-micro'),
    LocatorYUI = require('locator-yui'),
    app = express(),
    loca = new Locator({
        buildDirectory: 'build'
    });

app.set('locator', loca);
app.set('layout', 'index');

expview.extend(app);
expyui.extend(app);

// serving static yui modules
app.use(expyui['static']());

// creating a page with YUI embeded
app.get('/bar', expyui.expose(), function (req, res, next) {
    res.render('bar', {
        tagline: 'testing with some data for template bar',
        tellme: 'but miami is awesome!'
    });
});

// creating a page with YUI embeded
app.get('/foo', expyui.expose(), function (req, res, next) {
    res.render('foo', {
        tagline: 'testing some data for template foo',
        tellme: 'san francisco is nice!'
    });
});

loca.plug(new LocatorHandlebars({ format: 'yui' }))
    .plug(new LocatorMicro({ format: 'yui' }))
    .plug(new LocatorYUI({}))
    .parseBundle(__dirname, {}).then(function (have) {

        // listening for traffic only after locator finishes the walking process
        app.listen(3000, function () {
            console.log("Server listening on port 3000");
        });

    }, function (e) {
        console.log(e);
        console.log(e.stack);
    });
