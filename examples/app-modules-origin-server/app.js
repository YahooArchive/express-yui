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
    allowRollup: false
}, __dirname + '/../../node_modules/yui');

// registering the group information for a group named `metas`
app.use(yui.registerGroup('metas', './build'));

app.configure('development', function () {

    // when using `yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.use(yui.debugMode());

    // getting YUI Core modules from the app origin.
    app.use(yui.serveCoreFromAppOrigin({
        // any special loader group configuration
    }));

    // we can get app modules from the app origin.
    app.use(yui.serveGroupFromAppOrigin('metas', {
        // any special loader group configuration
    }));

});

app.configure('production', function () {

    // getting YUI Core modules from the app origin.
    app.use(yui.serveCoreFromAppOrigin());

    // when running in production to use a CDN that
    // will use the app as origin server
    app.use(yui.serveGroupFromAppOrigin('app', {
        // special loader group configuration
        base: 'http://flickrcdn.com/app/',
        comboBase: 'http://flickrcdn.com/combo?',
        comboSep: '&',
        root: 'app/'
    }));

    // in prod we should use the combo
    app.use(yui.serveCombinedFromAppOrigin());

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
