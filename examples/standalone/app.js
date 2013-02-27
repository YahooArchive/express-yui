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
    // when using `yui.debug()` you will get debug,
    // filter and logLevel set accordingly
    yui.debug();

    // In development, we can get YUI from CDN, but
    // passing some extra configuration, like `combine`
    // to facilitate debugging.
    yui.serveCoreFromCDN({
        combine: false
    });
});

app.configure('production', function () {
    // normally, production is the default configuration,
    // but here is an example of forcing to use CDN
    // for yui core modules with a custom root folder
    yui.serveCoreFromCDN({
        root: yui.version + "/build/"
    });
});

// by default, the seed will be just `yui-base`, but we can
// extend the list by adding more modules to the seed constructor
app.use(yui.seed(['yui-base', 'loader-base', 'loader-yui3']));

// printing runtime information
app.get('*', yui.expose(), function (req, res, next) {
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