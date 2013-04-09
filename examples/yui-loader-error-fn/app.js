/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'), // modown-yui
    app     = express();

// you can use a custom version of YUI by
// specifying a custom path as a second argument,
// or by installing yui at the app level using npm.
// in this example we are using the yui from
// npm's devDependencies.
yui({
    allowRollup: false,
    loadErrorFn: function (Y, fn, err) {
        // this code gets executed in the client side
        // reporting: "Missing modules: foo"
        Y.one('#content').setContent(err.msg);
    },
    onProgress: function (e) {
        var moduleName = e.data[0].name;
        // We can register non-yui modules as yui dynamically.
        // In this case, registering any module with prefix
        // `dust-` under the Y.Dust[name] structure.
        // More info about this technique here:
        // https://speakerdeck.com/yaypie/when-not-to-use-yui?slide=80
        if (moduleName.indexOf('dust-') === 0) {
            YUI.add(moduleName, function (Y) {
                Y.namespace('Dust')[moduleName] = Y.config.win[moduleName];
            });
        }
    }
}, __dirname + '/node_modules/yui');

app.configure('development', function () {

    // when using `yui.debugMode()` you will get debug,
    // filter and logLevel set accordingly
    app.use(yui.debugMode());

});

// getting YUI Core modules from CDN.
app.use(yui.serveCoreFromCDN());

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
