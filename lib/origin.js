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

        loaderConfig = this.config({
            maxURLLength: 1024,
            base: yuiPrefix,
            comboBase: "/combo~",
            comboSep: "~",
            root: "/"
        }, loaderConfig);

        if (!this.path) {
            throw new Error('Unable to serve YUI Core modules. ' +
                'Make sure you call `yui()` to set up the path ' +
                'to yui npm package.');
        }

        staticHandler = middleware['static'](this.path, options);
        comboHandler  = middleware.combine(this.path, options);

        return function (req, res, next) {
            if (req.url && req.url.indexOf(loaderConfig.base) === 0) {
                req.url = req.url.slice(loaderConfig.base.length);
                staticHandler(req, res, next);
            } else if (req.url && req.url.indexOf(loaderConfig.comboBase) === 0) {
                req.url = req.url.slice(loaderConfig.comboBase.length);
                comboHandler(req, res, next);
            } else {
                next();
            }
        };

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

        loaderConfig = utils.extend(config.groups.app, {
            maxURLLength: 1024,
            base: yuiPrefix,
            comboBase: "/combo~",
            comboSep: "~",
            root: "/"
        }, loaderConfig);

        modules = config.groups.app.modules || {};

        for (mod in modules) {
            if (modules.hasOwnProperty(mod)) {
                urlMap[mod.path] = mod.fullpath;
            }
        }

        options = options || {};
        options.map = urlMap;

        staticHandler = middleware['static'](this.path, options);
        comboHandler  = middleware.combine(this.path, options);

        return function (req, res, next) {
            if (req.url && req.url.indexOf(loaderConfig.base) === 0) {
                req.url = req.url.slice(loaderConfig.base.length);
                staticHandler(req, res, next);
            } else if (req.url && req.url.indexOf(loaderConfig.comboBase) === 0) {
                req.url = req.url.slice(loaderConfig.comboBase.length);
                comboHandler(req, res, next);
            } else {
                next();
            }
        };

    }

};
