/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils      = require('./utils'),
    middleware = require('./static');

module.exports = {

    /**
     * Serves YUI Core Modules from the same origin as to
     * where the application is hosted
     *
     * @method serveCoreFromAppOrigin
     * @param {Object} loaderConfig
     * @param {Object} options express static handler options
     * @return {function[]} express static middlewares
     */
    serveCoreFromAppOrigin: function (loaderConfig, options) {

        var yuiPrefix = "/static/yui/",
            staticHandler,
            comboHandler;

        this.config({
            maxURLLength: 1024,
            base: yuiPrefix,
            comboBase: "/combo~",
            comboSep: "~",
            root: yuiPrefix
        }, loaderConfig);

        if (!this.path) {
            throw new Error('Unable to serve YUI Core modules. ' +
                'Make sure you call `yui()` to set up the path ' +
                'to yui npm package.');
        }

        staticHandler = middleware['static'](this.path, options);
        comboHandler  = middleware.combine(this.path, options);

        return [staticHandler, comboHandler];

    },

    /**
     * Serves App Modules from the same origin as to
     * where the application is hosted
     *
     * @method serveModulesFromAppOrigin
     * @param {Object} loaderConfig
     * @param {Object} options express static handler options
     * @return {function[]} express static middlewares
     */
    serveModulesFromAppOrigin: function (loaderConfig, options) {

        var yuiPrefix = "/static/",
            config = this.config(),
            urlMap = {},
            modules,
            mod,
            staticHandler,
            comboHandler;

        config.groups = config.groups || {};
        config.groups.app = config.groups.app || {};

        // inherit combine if needed
        if (!config.groups.app.hasOwnProperty('combine')) {
            config.groups.app.combine = !!config.combine;
        }

        utils.extend(config.groups.app, {
            maxURLLength: 1024,
            base: yuiPrefix,
            comboBase: "/combo~",
            comboSep: "~",
            root: yuiPrefix
        }, loaderConfig);

        modules = config.groups.app.modules || {};

        for (mod in modules) {
            if (modules.hasOwnProperty(mod)) {
                urlMap[mod.path] = mod.fullpath;
            }
        }

        staticHandler = middleware['static'](urlMap, options);
        comboHandler  = middleware.combine(urlMap, options);

        return [staticHandler, comboHandler];

    }

};
