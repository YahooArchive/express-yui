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
     * where the application is hosted.
     *
     * @method serveCoreFromAppOrigin
     * @param {Object} loaderConfig
     * @param {Object} options express static handler options
     * @return {function[]} express static middlewares
     */
    serveCoreFromAppOrigin: function (loaderConfig, options) {

        var yuiPrefix = "/static/",
            staticHandler,
            comboHandler;

        loaderConfig = this.config(this.getComboConfig(), {
            base: yuiPrefix + "yui/",
            root: "yui/"
        }, loaderConfig);

        if (!this.path) {
            throw new Error('Unable to serve YUI Core modules. ' +
                'Make sure you call `yui()` to set up the path ' +
                'to yui npm package.');
        }

        staticHandler = middleware['static'](this.path, options);

        return function (req, res, next) {
            if (req.url && req.url.indexOf(loaderConfig.base) === 0) {
                req.url = req.url.slice(loaderConfig.base.length);
                staticHandler(req, res, next);
            } else {
                next();
            }
        };

    },

    /**
     * Serves App Modules from the same origin as to
     * where the application is hosted.
     *
     * @method serveGroupFromAppOrigin
     * @param {String} groupName The group name, usually `app`.
     * @param {Object} loaderConfig The custom loader configuration
     * for the group.
     * @param {Object} options express static handler options
     * @return {function[]} express static middlewares
     */
    serveGroupFromAppOrigin: function (groupName, loaderConfig, options) {

        if (!groupName) {
            console.log("Skipping Group, required argument `groupName` when " +
                "calling `yui.serveGroupFromAppOrigin();");
            return false;
        }

        var yuiPrefix = "/static/",
            groupPrefix = groupName + "/",
            config = this.config(),
            path = (options && options.root) || (process.cwd() + '/'),
            urlMap = {},
            modules,
            mod,
            staticHandler,
            comboHandler,
            groupConfig;

        config.groups = config.groups || {};
        groupConfig = config.groups[groupName] =
            config.groups[groupName] || {};

        // inherit combine if needed
        if (!groupConfig.hasOwnProperty('combine')) {
            groupConfig.combine = config.combine;
        }

        loaderConfig = utils.extend(groupConfig, this.getComboConfig(), {
            base: yuiPrefix + groupPrefix,
            root:  groupPrefix
        }, loaderConfig);

        modules = groupConfig.modules || {};

        for (mod in modules) {
            if (modules.hasOwnProperty(mod)) {
                if (modules[mod].fullpath.indexOf(path) === 0) {
                    urlMap[modules[mod].path] = modules[mod].fullpath.slice(path.length);
                } else {
                    console.warn('Skiping module [' + mod + '] because ' +
                        'file [' + modules[mod].fullpath + '] is not under ' +
                        'the app folder [' + path + ']');
                }
            }
        }

        options = options || {};
        options.map = urlMap;
        staticHandler = middleware['static'](path, options);

        return function (req, res, next) {
            if (req.url && req.url.indexOf(loaderConfig.base) === 0) {
                req.url = req.url.slice(loaderConfig.base.length);
                staticHandler(req, res, next);
            } else {
                next();
            }
        };

    },

    getComboConfig: function () {
        return {
            maxURLLength: 1024,
            comboBase: "/combo~",
            comboSep: "~"
        };
    },

    combine: function (options) {
        var path = process.cwd() + '/',
            comboHandler = middleware.combine(path, options),
            loaderConfig = this.getComboConfig(),
            map = {},
            groups,
            group;

        // TODO: build map

        return function (req, res, next) {

            next(); // TBD

            if (req.url && req.url.indexOf(loaderConfig.comboBase) === 0) {
                req.url = req.url.slice(loaderConfig.comboBase.length);
                // adjust mapping
                comboHandler(req, res, next);
            } else {
                next();
            }
        };

    }

};
