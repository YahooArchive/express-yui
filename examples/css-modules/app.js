/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    expyui = require('../../'), // express-yui
    expview = require('express-view'),
    Locator = require('locator'),
    LocatorHandlebars = require('locator-handlebars'),
    LocatorYUI = require('locator-yui'),
    app = express(),
    loca = new Locator({
        buildDirectory: __dirname + '/build'
    });

app.set('locator', loca);

expyui.extend(app);
expview.extend(app);

// serving static yui modules
app.use(expyui['static'](__dirname + '/build'));

// creating a page with YUI embeded
app.get('/', expyui.expose(), function (req, res, next) {
    // here is an example of how to compute custom urls for a set of css modules
    // that should be included in the `head` instead of using them thru `Y.use()`
    var links = req.app.yui.buildCSSUrls('cssbar');
    // passing the first url (there is a single module anyways) so we can
    // use it in the templates
    res.locals['computed-cssbar-url'] = links[0];
    // rendering `templates/page.handlebars`
    res.render('page');
});

// locator plugins
loca.plug(new LocatorHandlebars({ format: 'yui' }))
    .plug(new LocatorYUI({
        // TODO: fix cssproc (if you have a deep route like /foo/bar, images will not load)
        // cssproc: '/' // path to prefix every url() in the css files
    }))
    .parseBundle(__dirname);

app.yui.ready(function (err) {
    if (err) {
        console.log(err);
        console.log(err.stack);
        return;
    }
    // listening for traffic only after locator finishes the walking process
    app.listen(3000, function () {
        console.log("Server listening on port 3000");
    });
});