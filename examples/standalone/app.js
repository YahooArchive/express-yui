/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    yui     = require('../../'),
    app     = express();

// you can use a custom version of YUI by
// specifying a custom path as a second argument,
// or by installing yui at th app level using npm.
// in this example we are using the yui from
// npm's devDependencies.
yui({
    "allowRollup" : false
}, __dirname + '/../../node_modules/yui');

app.configure('development', function () {
    yui.debug({
        combine: false
    });
});

app.configure('production', function () {
    // normally, production is the default configuration
});

app.use(
    yui.seed(['yui-base', 'loader-base', 'loader-yui3']),
    yui.serveCoreFromCDN({
        root: yui.version + "/build/"
    })
);

// printing runtime information
app.get('*', yui.expose(), function (req, res, next) {
    res.send({
        app: yui.config(),
        res: res.locals.yui || null,
        yui_config: res.locals.yui_config,
        yui_seed: res.locals.yui_seed
    });
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});