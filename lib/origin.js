/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils      = require('./utils'),
    middleware = require('./static'),

    DEFAULT_COMBO_CONFIG = {
        maxURLLength: 1024,
        comboBase: "/combo~",
        comboSep: "~"
    };

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

        loaderConfig = this.config(DEFAULT_COMBO_CONFIG, {
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
                "calling `yui.serveGroupFromAppOrigin();`");
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

        loaderConfig = utils.extend(groupConfig, DEFAULT_COMBO_CONFIG, {
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

    serveCombinedFromAppOrigin: function (options) {
        var path = process.cwd() + '/',
            config = this.config(),
            comboHandler,
            groups = config.groups || {},
            group,
            modules,
            mod,
            regex,
            yuiPathCorrector = this.path;

        // getting options ready, mixing it with default values
        options = utils.extend({
            map: {}
        }, DEFAULT_COMBO_CONFIG, (options || {}));

        function fnTestGroup(g) {
            return g.comboBase === options.comboBase &&
                g.comboSep === options.comboSep &&
                g.combine !== false && g.root;
        }

        if (fnTestGroup(config)) {
            config.combine = true;   /* forcing combine for yui */
            options.map.yui = {
                prefix: config.root, /* prefix used to identify files from this group */
                path: this.path,     /* path to the folder that holds yui npm pkg */
                url: undefined       /* not need to map, just lookup in fs */
            };
        }

        // build the module map for combo
        for (group in groups) {
            if (groups.hasOwnProperty(group) && groups[group].modules &&
                    fnTestGroup(groups[group])) {

                groups[group].combine = true; /* forcing combine for group */

                options.map[group] = {
                    prefix: groups[group].root, /* prefix used to identify files from this group */
                    path: path,                 /* path to the app folder */
                    urls: {}                     /* forcing to map for security reasons */
                };

                modules = groups[group].modules;
                for (mod in modules) {
                    if (modules.hasOwnProperty(mod)) {

                        if (modules[mod].fullpath &&
                                modules[mod].fullpath.indexOf(path) === 0) {
                            options.map[group].urls[modules[mod].path] =
                                modules[mod].fullpath.slice(path.length);
                        } else {
                            console.warn('Skiping module [' + mod + '] because ' +
                                'file [' + modules[mod].fullpath + '] is not under ' +
                                'the app folder [' + path + ']');
                        }

                    }
                }

            }
        }

        // releasing some memory
        groups = group = modules = mod = null;

        return middleware.combine(path, options);

    }

};
