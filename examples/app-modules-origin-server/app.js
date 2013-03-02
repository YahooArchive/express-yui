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

app.configure('development', function () {

    // when using `yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.use(yui.debugMode());

});

// getting YUI Core modules from the app origin.
app.use(yui.serveCoreFromAppOrigin());

// we can get app modules from the app origin.
app.use(yui.serveGroupFromAppOrigin('app', {
    modules: {
        foo: {
            path: "assets/foo.js",
            fullpath: __dirname + "/assets/foo.js",
            requires: ["node"]
        },
        bar: {
            path: "bar-hash123.js",
            fullpath: __dirname + "/assets/bar.js",
            requires: ["io-base", "foo"]
        },
        baz: {
            path: "baz-123.css",
            fullpath: __dirname + "/assets/baz.css",
            type: "css"
        },
        xyz: {
            path: "xyz.css",
            fullpath: __dirname + "/assets/xyz.css",
            type: "css",
            requires: ["baz"]
        }
    }
}));

app.use(yui.serveCombinedFromAppOrigin());

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
