/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint eqeqeq: false*/
/*global app*/
/**
Provides a set of features to control a YUI instance on the client side.
This module will be serialized and sent to the client side using `express-prep-client`.

@module express-yui/lib/client
**/

var utils = require('./utils');

// NOTE: these two functions are meant to be executed in the client side
//       and for that, they will be serialized and mocked by prep-client
module.exports = {
    /**
    Boots the application, rehydrate the app state and calls back to notify the
    `ready` state of the app.

        <script>{{{state}}}</script>
        <script>
        app.yui.ready(function (err) {
            if (err) {
                throw err;
            }
            app.yui.use('foo', 'bar', function (Y) {
                // do something!
            });
        });
        </script>

    @method ready
    @param {Function} callback when the app is ready. If an error occurr, the error object
                        will be passed as the first argument of the callback function.
    @public
    **/
    "app.yui.ready": utils.minifyFunction(function (callback) {
        var config, i, Y;
        if (!app.yui._Y) {
            config = typeof YUI_config !== undefined ? YUI_config : {};
            // extend core (YUI_config.extendedCore)
            YUI.Env.core.push.apply(YUI.Env.core, config.extendedCore || []);
            // create unique instance which is accesible thru app.yui.use()
            Y = app.yui._Y = YUI();
            app.yui.use = Y.use;
            app.yui.require = Y.require;
            // applying loader patches
            if (config.patches && config.patches.length) {
                for (i = 0; i < config.patches.length; i += 1) {
                    config.patches[i](Y, Y.Env._loader);
                }
            }
        }
        callback();
    }),

    /**
    This method is a bootstrap implementation for the library, and the way
    you use this in your templates, is by doing this:

        <script>{{{state}}}</script>
        <script>
        app.yui.use('foo', 'bar', function (Y) {
            // do something!
        });
        </script>

    This method is mocked by `express-prep-client` to guarantee the timeline.

    @method use
    @public
    **/
    "app.yui.use": utils.minifyFunction(function () {
        var a = arguments;
        app.yui.ready(function () {
            app.yui.use.apply(app.yui._Y, a);
        });
    }),

    /**
    Like `app.yui.use()` but instead delegates to `YUI().require()`. The callback
    passed to `require()` receives two arguments, the `Y` object like `use()`,
    but also `imports` which holds all of the exports from the required modules.

        <script>{{{state}}}</script>
        <script>
        app.yui.require('foo', 'bar', function (Y, imports) {
            var Foo         = imports['foo'],
                namedExport = imports['bar'].baz;
        });
        </script>

    @method require
    @public
    **/
    "app.yui.require": utils.minifyFunction(function () {
        var a = arguments;
        app.yui.ready(function () {
            app.yui.require.apply(app.yui._Y, a);
        });
    })

};
