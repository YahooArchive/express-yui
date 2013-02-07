# Mojito Server YUI Component

This compontent is responsible for exposing the
`yui` configuration at the app level using
`yui.config()` object, as well as per request
customization. 

If the component is plug within `mojito`, it will
automatically attach the `yui` configuration
into the runtime object produced by `mojito-server`.

## Usage as stand alone middleware for express

```
/*jslint node:true, nomen: true*/

'use strict';

var express = require('express'),
    yui     = require('mojito-yui'),
    app     = express();

app.configure('development', function () {
    yui({
        combine: false,
        debug: true,
        filter: "debug"
    });
    // you can also use a custom version of YUI by
    // specifying a custom path as a second argument,
    // or by installing yui at th app level using npm:
    // yui({
    //     combine: false,
    //     debug: true,
    //     filter: "debug"
    // }, __dirname + '/node_modules/yui/');

    // serving YUI from local server
    app.use(yui.local({
        // overruling any default config provided by yui.cdn()
        // routine by passing a new value. E.g:
        // comboSep: '~'
    }));
});

app.configure('production', function () {
    yui({
        combine: true,
        debug: false,
        filter: "min"
    });

    // serving YUI from CDN directly
    app.use(yui.cdn());
});

// forcing YUI to run in debug mode for specific path
app.get('/debug', yui.debug());

// printing runtime information
app.get('*', function (req, res, next) {
    res.send({
        server: yui.locals,
        req: res.locals.yui,
        runtime: yui.flatten(res.locals.yui)
    });
});

// listening
app.set('port', process.env.PORT || 8666);
app.listen(app.get('port'), function () {
    console.log("Server listening on port " +
        app.get('port') + " in " + app.get('env') + " mode");
});
```

## Usage within mojito

```
mojito.plug(require('mojito-yui'));
mojito.yui({
    combine: false,
    debug: true,
    filter: "debug"
});
app.use(mojito.yui.local());
```