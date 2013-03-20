/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `yui.origin` extension that provides a set of features
to mutate the express app into an origin server for yui
modules and static assets.

@module yui
@submodule origin
**/

'use strict';

var utils      = require('./utils'),
    middleware = require('modown-static'),
    NODE_ENV = process.env.NODE_ENV || 'development',

    DEFAULT_COMBO_CONFIG = {
        maxURLLength: 1024,
        comboBase: "/combo~",
        comboSep: "~"
    };

/**
The `yui.origin` extension that provides some basic configuration
that will facilitate the configuration of YUI Core modules and other
groups to be served from the express app in a form of origin server.

This is not recommended for production quality products, but
it is a very useful feature for development of offline applications.

    // Creates a new express app.
    var app = express();

    // Initialize yui middleware
    yui({}, 'path/to/yui/folder');

    // getting YUI Core modules from the app origin.
    app.use(yui.serveCoreFromAppOrigin());

    // getting group `app` from the app origin.
    app.use(yui.serveGroupFromAppOrigin('app', {
        modules: {
            foo: {
                path: "assets/foo.js",
                fullpath: __dirname + "/assets/foo.js",
                requires: ["node"]
            }
        }
    }));

    // add support for `combine` for core and `app` groups.
    app.use(yui.serveCombinedFromAppOrigin());

@class origin
@static
@uses utils, static
@extensionfor yui
*/
module.exports = {

    /**
    Adds a group of modules into the internal cache structure
    that will be used to map module names with groups and
    public paths. This mapping will be used by the seed
    generator.

    @method _addGroupToMap
    @private
    @param {String} groupName The name of the group to be mapped
    @param {Object} groupModules The hash with all modules and the
    corresponding configuration per module.
    **/
    _addGroupToMap: function (groupName, groupModules) {
        var mod,
            fullpath;

        this._map = this._map || {};

        // creating the internal mapping between modules
        // and the corresponding public path.
        for (mod in groupModules) {
            if (groupModules.hasOwnProperty(mod)) {
                this._map[mod] = {
                    path: groupModules[mod].path,
                    group: groupName
                };
            }
        }
    },

    /**
    Serves YUI Core Modules from the same origin as to
    where the application is hosted.

    @method serveCoreFromAppOrigin
    @public
    @param {Object} loaderConfig
    @param {Object} options express static handler options

        @param {string} options.prefix optional prefix used to
            form loader's `base`. If you are mounting the middleware
            under a particular path, you have to provide the prefix
            so loader can know about this mounted path.
            E.g.: `app.use('/static', yui.serveCoreFromAppOrigin({},
            {prefix: '/static/'}));`. Default is always `'`'`.

    @return {function} express middlewares
    **/
    serveCoreFromAppOrigin: function (loaderConfig, options) {

        options = options || {};

        var prefix = options.hasOwnProperty('prefix') ? options.prefix : "/";

        if (!this.path) {
            throw new Error('Unable to serve YUI Core modules. ' +
                'Make sure you call `yui()` to set up the path ' +
                'to yui npm package.');
        }

        loaderConfig = loaderConfig || {};
        // fixed base and root for this group
        loaderConfig.base = prefix + "yui/";
        loaderConfig.root = "/yui/";

        loaderConfig = this.config(DEFAULT_COMBO_CONFIG, loaderConfig);

        // Disable HTTP caching when in dev and no maxAge option is set
        if (!options.maxAge && NODE_ENV === "development") {
            options.maxAge = 0;
        }
        return middleware.folder('yui', this.path, options);

    },

    /**
    Serves App Modules from the same origin as to
    where the application is hosted.

    @method serveGroupFromAppOrigin
    @public
    @param {String} metaPath The public path for a yui module that contains
    the metas for a group.
    @param {Object} loaderConfig The custom loader configuration
    for the group.

        @param {number} loaderConfig.maxURLLength default to `1024`
        @param {string} loaderConfig.comboBase default to `"/combo~"`
        @param {string} loaderConfig.comboSep default to `"~"`

    @param {object|function} fullpathResolver A function that can
    be invoked per module to translate the public path into a
    filesystem path or a hash table with public path matching
    filesystem path.
    @param {Object} options express static handler options

        @param {string} options.prefix optional prefix used to
        form loader's `base`. If you are mounting the middleware
        under a particular path, you have to provide the prefix
        so loader can know about this mounted path.
        E.g.: `app.use('/static', yui.serveGroupFromAppOrigin('meta.js',
        {}, resolver, {prefix: '/static/'}));`. Default is always `'`'`.
        @param {string} options.root optional filesystem path which will
        be used as a prefix for the fullpath we get from `fullpathResolver`.

    @return {function} express middlewares
    **/
    serveGroupFromAppOrigin: function (metaPath, loaderConfig, fullpathResolver, options) {

        options = options || {};

        var yuiPrefix = options.hasOwnProperty('prefix') ? options.prefix : "/",
            group,
            groupName,
            config = this.config(),
            fullpath,
            comboHandler,
            groupConfig,
            resolver,
            mod,
            urls = {};

        // adjusting fullpathResolver in case it holds the map
        // instead of a function
        resolver = (typeof fullpathResolver === 'function' ?
                fullpathResolver :
                function (path) {
                    return fullpathResolver[path];
                });

        // resolving the fullpath for metas
        fullpath = resolver(metaPath);
        if (!fullpath) {
            console.warn('Invalid meta file [' + metaPath + '].');
            return false;
        }

        // handling over the fullpath to the group config analyzer
        // to collect the group information from the meta file
        group = this.getGroupConfig(fullpath);

        if (!group) {
            console.warn("Skipping Group, required argument `metaPath` when " +
                "calling `yui.serveGroupFromAppOrigin();`");
            return false;
        }

        groupName = group.groupName;

        config.groups = config.groups || {};
        config.groups[groupName] = groupConfig =
            config.groups[groupName] || {};

        // inherit combine if needed
        if (!groupConfig.hasOwnProperty('combine')) {
            groupConfig.combine = config.combine;
        }

        loaderConfig = loaderConfig || {};
        loaderConfig.base = yuiPrefix + groupName + "/";
        loaderConfig.root = "/" + groupName + "/";

        loaderConfig = utils.extend(groupConfig, DEFAULT_COMBO_CONFIG,
            loaderConfig);


        // adding meta module ot the group.modules
        // because it is not part it by default (chicken or egg)
        group.modules[group.moduleName] = { path: metaPath };

        // mapping all modules in the group
        this._addGroupToMap(groupName, group.modules);

        // add the meta module into the core structure
        // to make sure it gets attached to Y upfront
        this.addModuleToSeed(group.moduleName);

        for (mod in group.modules) {
            if (group.modules.hasOwnProperty(mod)) {
                urls[group.modules[mod].path] =
                    resolver(group.modules[mod].path);
            }
        }

        // Disable HTTP caching when in dev and no maxAge option is set
        if (!options.maxAge && NODE_ENV === "development") {
            options.maxAge = 0;
        }

        return middleware.map(groupName, urls, options);

    },

    /**
    Serves modules and assets combined including core modules
    and custom groups. Only those groups that matches the values
    of `options.comboBase` and `options.comboSep` will be
    combined. While the default confuration for the combo is:

        {
            maxURLLength: 1024,
            comboBase: "/combo~",
            comboSep: "~"
        }

    Here is an example of how to use it:

        app.use(yui.serveCombinedFromAppOrigin());

    Note: this method should be called after defining
    the settings for all groups and core modules.

    @method serveCombinedFromAppOrigin
    @public
    @param {Object} options static combo handler options

        @param {number} maxURLLength default to `1024`
        @param {string} comboBase default to `"/combo~"`
        @param {string} comboSep default to `"~"`

    @return {function} express middlewares
    **/
    serveCombinedFromAppOrigin: function (options) {

        var config = this.config(),
            groups = config.groups || {},
            group;

        // getting options ready, mixing it with default values
        options = utils.extend({}, DEFAULT_COMBO_CONFIG, (options || {}));

        function fnTestGroup(g) {
            return g.comboBase === options.comboBase &&
                g.comboSep === options.comboSep &&
                g.combine !== false && g.root;
        }

        /* forcing combine for yui */
        if (fnTestGroup(config)) {
            config.combine = true;
        }

        /* forcing combine for group that can work with combo */
        for (group in groups) {
            if (groups.hasOwnProperty(group) && fnTestGroup(groups[group])) {
                groups[group].combine = true;
            }
        }

        // Disable HTTP caching when in dev and no maxAge option is set
        if (!options.maxAge && NODE_ENV === "development") {
            options.maxAge = 0;
        }

        return middleware.combine(options);

    }

};
