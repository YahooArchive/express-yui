/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
Provides some basic features to expose yui configurations information thru `res.expose()`
that could be used to boot `YUI` in the client runtime. It also provide some sugar to
expose static assests that are YUI related.

@module express-yui/lib/middleware
**/

'use strict';

var client = require('./client'),
    utils = require('./utils');

/**
Exports few middleware.

@class middleware
@static
@uses client, utils, *debug, *express, *yui
@extensionfor express-yui
*/
module.exports = {

    /**
    Exposes the yui configuration into `res.locals.state`. It also
    exposes the `express-yui` wrapper for YUI on the client so you can
    access `app.yui.*` on the client side just like you do on the server
    side. The client wrapper includes `app.yui.ready()` and `app.yui.use()`
    with the corresponding bootstraping code to inject YUI into the page.
    This middleware will be invoked by `expyui.expose()` middleware
    automatically, which means you do not need to call it directly.

    @method exposeConfig
    @protected
    @return {function} express middleware
    **/
    exposeConfig: function () {

        var configCache;

        return function (req, res, next) {

            var yui_config = configCache;

            // if app.yui exists, we can expose the configuration
            if (!yui_config && req.app && req.app.yui) {
                // one time operation to compute the initial configuration
                yui_config = configCache = req.app.yui.config();

                // exposing the `YUI_config`
                req.app.expose(yui_config, 'window.YUI_config', {cache: true});
                req.app.expose(client, 'window.app.yui', {cache: true});
            }

            next();

        };

    },

    /**
    Expose the seed information into `res.locals.state`. This seed is
    an array of urls based on the call to `app.yui.seed()`, which is
    going to be used by the client bootstrap code to inject YUI into
    the page.
    This middleware will be invoked by `expyui.expose()` middleware
    automatically, which means you do not need to call it directly.

    @method exposeSeed
    @protected
    @return {function} express middleware
    **/
    exposeSeed: function () {

        var configCache,
            seedCache;

        return function (req, res, next) {

            var yui_config = configCache,
                yui_seed   = seedCache;

            // if app.yui exists, we can expose the configuration
            if (!(yui_config || yui_seed) && req.app && req.app.yui) {
                // one time operation to compute the initial configuration and seed.
                yui_config = configCache = req.app.yui.config();
                yui_seed = seedCache = req.app.yui.getSeedUrls();

                req.app.expose(yui_seed, 'window.YUI_config.seed', {cache: true});
            }

            next();

        };

    },

    /**
    Exposes YUI into the client side. This middleware bundles
    `expyui.exposeConfig()` and `expyui.exposeSeed()` middleware.

        var express = require('express'),
            expyui = require('express-yui'),
            app = express();

        expyui.extend(app);

        // using it for a mounted middleware for all requests
        app.use(expyui.expose());

    In the example above, the `state` of the app will be serialized
    per request, and can be used in the template to set up the client
    side to run YUI with the same configuration used on the server side.
    Here is an example of a handlebars template:

        <script>
        {{{state}}}
        app.yui.use('node', function (Y) {
            Y.one('#content').setContent('<p>Ready!</p>');
        });
        </script>

    @method expose
    @public
    @return {function} express middleware
    **/
    expose: function () {

        var handlers = [this.exposeConfig(), this.exposeSeed()];

        return function (req, res, next) {

            function run(index) {
                if (index < handlers.length) {
                    handlers[index](req, res, function (err) {
                        if (err) {
                            return next(err);
                        }
                        index += 1;
                        run(index);
                    });
                } else {
                    next();
                }
            }

            run(0);

        };

    },

    /**
    Forces a request to use yui in debug mode with combine disabled.

        // exposing yui into the client side thru `state` object
        app.use(expyui.expose());
        // using yui in debug mode when node runs in debug mode with custom filter
        if (app.get('env') === 'development') {
            app.use(expyui.debug({filter: 'raw'}));
        }

    Note: the `expyui.debug()` middleware only works if it is called
    after the regular `expyui.expose()` middleware was called, otherwise
    it will not be able to overrule the default yui config for the app.

    More details about the yui debug mode settings
    [in the YUI API Docs](http://yuilibrary.com/yui/docs/api/classes/config.html).

    @method debug
    @public
    @param {Object} config optional debug settings
        @param {boolean} config.combine default to `false`
        @param {string} config.logLevel default to `"debug"`
        @param {string} config.filter default to `"debug"`
        @param {boolean} config.useBrowserConsole optional debug settings
    @return {function} express middleware
    **/
    debug: function (config) {

        config = config || {};

        var filter = config.filter || 'debug',
            combine = config.combine || false,
            logLevel = config.logLevel || 'debug',
            useBrowserConsole = config.hasOwnProperty('useBrowserConsole') ? config.useBrowserConsole : true;

        return function debug(req, res, next) {
            res.expose(filter, 'window.YUI_config.filter');
            res.expose(combine || false, 'window.YUI_config.combine');
            res.expose(true, 'window.YUI_config.debug');
            res.expose(logLevel, 'window.YUI_config.logLevel');
            res.expose(useBrowserConsole, 'window.YUI_config.useBrowserConsole');
            res.expose(req.app.yui.getSeedUrls({
                filter: filter,
                combine: combine
            }), 'window.YUI_config.seed');
            next();
        };

    },

    /**
    Serves YUI Modules as static assets. All registered groups and core will be
    served from app origin.

        app.use(expyui.static(__dirname + '/build'));

    The example above behaves very similar to `express.static()` middleware, but
    it adds some sugar to also server YUI core modules as synthetic files, so you
    can combine yui core modules with app specific modules for better performance.
    If also adds some extra headers to avoid caching static files in a browser
    when nodejs is running in debug mode to facilitate development.

    @method static
    @public
    @param {string} buildDirectory fullpath to locator build directory
    @param {Object} options express static handler options
    @return {Object} express app that can be mounted into another express app.
    **/
    'static': function (buildDirectory, options) {
        var express = require('express'),
            YUI = require('yui'),
            version = YUI.YUI.version,
            path = YUI.path(),
            app;

        options = options || {};

        // Disable HTTP caching when in dev and no maxAge option is set
        if (!options.maxAge && utils.debugMode) {
            options.maxAge = 0;
        }

        // creating an internal express app for static assets and
        app = express();
        // registering yui as the first entry mounted under the yui version
        app.use('/yui-' + version, express['static'](path, options));
        // now registering the build directory from locator
        app.use(express['static'](buildDirectory, options));

        // returning the app that can be mounted as an express middleware
        return app;
    }

};
