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
    yui.config({
        combine: false,
        debug: true,
        filter: "debug"
    });
});

app.configure('production', function () {
    yui.config({
        combine: true,
        debug: false,
        filter: "min"
    });
});

// printing runtime information
app.get('*', yui.expose, function (req, res, next) {
    res.send({
        app: yui.config(),
        res: res.locals.yui || null,
        yui_config: res.locals.yui.config,
        yui_seed: res.locals.yui_seed
    });
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
