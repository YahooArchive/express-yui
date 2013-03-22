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

var libpath    = require('path'),
    utils      = require('./utils'),
    middleware = require('modown-static'),
    NODE_ENV   = process.env.NODE_ENV || 'development',

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
            {prefix: '/static/'}));`. Default is always `'/'`.

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
    Serves an already registered group from the app origin server as to
    where the application is hosted.

    @method serveGroupFromAppOrigin
    @public
    @param {String} groupName the name of the group used by loader.
    @param {Object} loaderConfig The custom loader configuration
    for the group.

        @param {number} loaderConfig.maxURLLength default to `1024`
        @param {string} loaderConfig.comboBase default to `"/combo~"`
        @param {string} loaderConfig.comboSep default to `"~"`

    @param {Object} options express static handler options

        @param {string} options.prefix optional prefix used to
        form loader's `base`. If you are mounting the middleware
        under a particular path, you have to provide the prefix
        so loader can know about this mounted path.
        E.g.: `app.use('/static', yui.serveGroupFromAppOrigin('app',
        {}, {prefix: '/static/'}));`. Default is always `'/'`.

    @return {function} express middlewares
    **/
    serveGroupFromAppOrigin: function (groupName, loaderConfig, options) {

        options = options || {};

        var yuiPrefix = options.hasOwnProperty('prefix') ? options.prefix : "/",
            config = this.config(),
            folderPath = groupName && this._groupFolderMap && this._groupFolderMap[groupName];

        if (!folderPath || !config.groups || !config.groups[groupName]) {
            console.warn("Unkown group name [" + groupName + '], ' +
                "you should register the group by calling `regiterGroup()` method.");
            return false;
        }

        loaderConfig = loaderConfig || {};
        loaderConfig.base = yuiPrefix + groupName + "/";
        loaderConfig.root = "/" + groupName + "/";

        loaderConfig = utils.extend(config.groups[groupName], DEFAULT_COMBO_CONFIG,
            loaderConfig);

        // Disable HTTP caching when in dev and no maxAge option is set
        if (!options.maxAge && NODE_ENV === "development") {
            options.maxAge = 0;
        }

        return middleware.folder(groupName, folderPath, options);

    },

    /**
    Register a group and its modules by analyzing the meta file and defining the
    group configuration for the loader. Groups can be served from origin app or
    from CDN by calling `serveGroupFromAppOrigin` or `serveGroupFromCDN`.

    @method registerGroup
    @public
    @param {String} groupName the name of the group used by loader.
    @param {String} groupRoot filesystem path for the group. This will be used to
    analyze all modules in the group.
    @return {function} express middlewares
    **/
    registerGroup: function (groupName, groupRoot) {

        var group,
            groupConfig,
            config,
            metaFile = libpath.join(groupRoot, groupName, groupName + '.js');

        // collect the group information from the meta file
        group = this.getGroupConfig(metaFile);

        if (!group) {
            console.warn("Invalid meta file [" + metaFile + '], ' +
                "it contains no group.");
            return false;
        }
        if (!group) {
            console.warn("Invalid meta file [" + metaFile + '], ' +
                "it contains no group.");
            return false;
        }

        if (groupName !== group.groupName) {
            console.warn("Mismatch between the groupName [" + groupName +
                "] and the group registered in [" + metaFile + "].");
            return false;
        }

        config = this.config();
        config.groups = config.groups || {};
        config.groups[groupName] = groupConfig =
            config.groups[groupName] || {};

        // inherit combine if needed
        if (!groupConfig.hasOwnProperty('combine')) {
            groupConfig.combine = config.combine;
        }

        // storing the root path to the group in case we
        // need it later to server the group from origin server
        this._groupFolderMap = this._groupFolderMap || {};
        this._groupFolderMap[groupName] = groupRoot;

        // add the meta module into the core structure
        // to make sure it gets attached to Y upfront
        this.addModuleToSeed(group.moduleName, groupName);

        return false;

    },

    /**
    Serves modules and assets combined including core modules
    and custom groups. Only those groups that matches the values
    of `options.comboBase` and `options.comboSep` will be
    combined. The default configuration for the combo is:

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

        // Log warn that no group was added. `serveCombinedFromAppOrigin` in
        // this case will do nothing.
        if (!this._map) {
            console.warn('Unable to serve combined combo requests. ' +
                         'Make sure serveCoreFromAppOrigin() ' +
                         'or/and serveGroupFromAppOrigin() is called ' +
                         'before calling serveCombinedFromAppOrigin().');
        }

        // getting options ready, mixing it with default values
        options = utils.extend({}, DEFAULT_COMBO_CONFIG, (options || {}));

        function fnTestGroup(g) {
            return g.comboBase === options.comboBase &&
                g.comboSep === options.comboSep &&
                g.combine !== false && g.root;
        }

        // forcing combine for yui
        if (fnTestGroup(config)) {
            config.combine = true;
        }

        // forcing combine for group that can work with combo
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
