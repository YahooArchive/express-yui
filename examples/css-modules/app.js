/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    expyui  = require('../../'), // express-yui
    Locator = require('locator'),
    LocatorHandlebars = require('locator-handlebars'),
    app = express();

expyui.extend(app);

app.set('view', app.yui.view());

// serving static yui modules
app.use(expyui['static']());

// creating a page with YUI embeded
app.get('/', expyui.expose(), function (req, res, next) {
    // here is an example of how to compute custom urls for a set of css modules
    // that should be included in the `head` instead of using them thru `Y.use()`
    // Note: `@demo` is optional to specify the group, which comes from `package.json>name`
    var links = req.app.yui.buildCSSUrls('cssbar@demo');
    // passing the first url (there is a single module anyways) so we can
    // use it in the templates
    res.locals['computed-cssbar-url'] = links[0];
    // rendering `templates/page.handlebars`
    res.render('page');
});

// locator initialiation
new Locator({
    buildDirectory: 'build'
})
    .plug(LocatorHandlebars.yui())
    .plug(app.yui.plugin({
        registerGroup: true,
        registerServerModules: true,
        cssproc: true
    }))
    .parseBundle(__dirname, {}).then(function (have) {

        // listening for traffic only after locator finishes the walking process
        app.listen(3000, function () {
            console.log("Server listening on port 3000");
        });

    }, function (e) {
        console.log(e);
        console.log(e.stack);
    });
