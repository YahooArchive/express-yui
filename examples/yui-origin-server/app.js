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

yui.plug(app);

app.configure('development', function () {
    // when using `yui.debug()` you will get debug,
    // filter and logLevel set accordingly
    yui.debug();
    // using the express app as origin server for
    // yui core modules
    yui.serveCoreFromAppOrigin();
});

app.configure('production', function () {
    yui.serveCoreFromCDN();
});

// printing runtime information
app.get('/', yui.expose(), function (req, res, next) {
    res.send({
        // runtime configuration
        app: yui.config(),
        // request specific configs
        res: res.locals.yui || null,
        // blob built from static configuration
        yui_config: res.locals.yui_config,
        // blob built from seed definition statically
        yui_seed: res.locals.yui_seed
    });
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});