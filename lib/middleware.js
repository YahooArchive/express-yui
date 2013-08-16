/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `express-yui` exports few middleware that provide some basic
features to attach information into the `res.locals` object
that could be used to boot `YUI` in the client runtime.

@module express-yui
@submodule middleware
**/

'use strict';

var utils = require('./utils'),
    libpath = require('path'),
    combo = require('express-combo'),
    client = require('./client');

/**
The `express-yui` exports few middleware that provide some basic
features to attach information into the `res.locals` object
that could be used to boot `YUI` in the client runtime.

    var express = require('express'),
        expyui = require('express-yui'),
        app = express();

    expyui.extend(app);
    app.use(expyui.expose());

@class middleware
@static
@uses utils, *path, *debug, *express-combo
@extensionfor yui
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
            }

            // exposing the `YUI_config`
            res.expose(yui_config, 'window.YUI_config');
            res.expose(client, 'window.app.yui');

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

        var seedCache;

        return function (req, res, next) {

            var yui_seed = seedCache;

            if (!yui_seed && req.app && req.app.yui) {
                yui_seed = seedCache = req.app.yui.getSeedUrls();
            }

            res.expose(yui_seed, 'window.YUI_config.seed');

            next();

        };

    },

    /**
    Exposes YUI into the client side. This middleware bundles
    `expyui.exposeConfig()` and `expyui.exposeSeed()` middleware.

        // using it for a mounted middleware
        app.use(expyui.expose());

        // or using it as a route middleware
        app.get('/foo', expyui.expose());

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

        app.use(expyui.static());

    @method static
    @public
    @param {Object} options express static handler options
    @return {Function} express middleware
    **/
    'static': function (options) {

        var staticCache;

        options = options || {};

        // Disable HTTP caching when in dev and no maxAge option is set
        if (!options.maxAge && utils.debugMode) {
            options.maxAge = 0;
        }

        function composeStaticHandlers(yui, comboConfig) {
            var config = yui.config(),
                groups = config.groups || {},
                group,
                handlers = [];

            // first, yui core
            handlers.push(combo.folder('yui-' + yui.version, yui.path, options));

            // second, each group might be marked as local, and should be included
            for (group in groups) {
                if (groups.hasOwnProperty(group) && yui._groupFolderMap && yui._groupFolderMap[group]) {
                    handlers.push(combo.folder(libpath.basename(yui._groupFolderMap[group]), yui._groupFolderMap[group], utils.extend({}, options)));
                }
            }

            // enabling combo handler using the custom setting when posible.
            handlers.push(combo.combine(utils.extend({}, options, comboConfig || utils.DEFAULT_COMBO_CONFIG)));

            return handlers;
        }

        return function (req, res, next) {

            var handlers = staticCache;

            function run(index) {
                if (handlers && index < handlers.length) {
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

            if (!handlers && req.app && req.app.yui) {
                handlers = staticCache = composeStaticHandlers(req.app.yui, req.app.set('yui combo config'));
            }

            run(0);
        };

    }

};
