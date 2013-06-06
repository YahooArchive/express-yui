/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'), // express-yui
    app     = express();

// registering the group information for a group named `metas`
app.yui.registerGroup('metas', './build');

app.configure('development', function () {

    // when using `app.yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.yui.debugMode();

    // to get YUI Core modules from the app origin.
    app.yui.setCoreFromAppOrigin({
        // any special loader group configuration
    });

});

app.configure('production', function () {

    // to get YUI Core modules from the app origin.
    app.yui.setCoreFromAppOrigin();

    // when running in production to use a CDN that
    // uses the app as origin server
    app.yui.setGroupFromAppOrigin('metas', {
        // special loader group configuration
        base: 'http://flickrcdn.com/app/',
        comboBase: 'http://flickrcdn.com/combo?',
        comboSep: '&',
        root: 'app/'
    });

    // in prod we should use the combo
    app.yui.combineGroups();

});

// template engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// serving static yui modules
app.use(yui['static']({
    maxAge: 100
}));

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
