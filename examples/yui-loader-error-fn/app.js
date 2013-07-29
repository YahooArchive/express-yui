/*jslint node:true, nomen: true*/
/*global YUI*/

'use strict';

var express = require('express'),
    exphbs  = require('express3-handlebars'),
    yui     = require('../../'), // express-yui
    app     = express();

// you can set custom configurations for YUI by
// calling app.yui.applyConfig(), this will automatically
// be set on the server and client side alike.
app.yui.applyConfig({
    allowRollup: false,
    loadErrorFn: function (Y, fn, err) {
        // this code gets executed in the client side
        // reporting: "Missing modules: foo"
        return (Y.one ? Y.one('#content').setContent(err.msg) : console.error(err.msg));
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
});

// getting YUI Core modules from CDN.
app.yui.setCoreFromCDN();

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
