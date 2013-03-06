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
    middleware = require('./static'),

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
    Adds a yui module name into the `core` YUI configuration
    which is used by loader to identify the pieces that are
    already part of the seed and should be attached to Y
    automatically.

    @method _addModuleToCore
    @private
    @param {String} moduleName the yui module name
    **/
    _addModuleToCore: function (moduleName) {
        var config = this.config();

        // add a new entry in the seed for the new core module
        // so it gets embeded in the page.
        config.seed = config.seed || ['yui-base'];
        config.seed.push(moduleName);

        // add a new entry in the core for the new core meta
        // to force to attach the module when calling `use()`
        // for the first time.
        config.core = ['get', 'features', 'intl-base', 'yui-log', 'yui-later', 'loader-base', 'loader-rollup', 'loader-yui3'];
        config.core.push(moduleName);
    },

    /**
    Adds a group of modules into the internal cache structure
    that will be used to map public paths with filesystem paths
    as well as module names with groups and partial paths. This
    mapping will be used by the seed generator and the static
    handlers.

    @method _addGroupToMap
    @private
    @param {String} groupName The name of the group to be mapped
    @param {Object} groupModules The hash with all modules and the
    corresponding configuration per module.
    @param {function} fullpathResolver A function that will be invoked
    per module to translate the public path into the filesystem path.
    **/
    _addGroupToMap: function (groupName, groupModules, fullpathResolver) {
        var mod,
            fullpath,
            appRootPath = process.cwd() + '/';

        this._map = this._map || {};
        this._urls = this._urls || {};
        this._urls[groupName] = this._urls[groupName] || {};

        // creating the internal mapping of urls and modules
        // that will be used by combine and by seed generator
        for (mod in groupModules) {
            if (groupModules.hasOwnProperty(mod)) {
                fullpath = fullpathResolver(groupModules[mod].path);
                if (fullpath && fullpath.indexOf(appRootPath) === 0) {
                    this._urls[groupName][groupModules[mod].path] =
                        fullpath.slice(appRootPath.length);
                    this._map[mod] = {
                        path: groupModules[mod].path,
                        group: groupName
                    };
                } else {
                    console.warn('Skiping module [' + mod + '] from ' +
                        'map because file [' + fullpath + '] is not ' +
                        'under the app folder [' + appRootPath + ']');
                }
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
    @return {function} express static middlewares
    **/
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

        @param {string} options.prefix used to form loader's `base` and
        `root`. default to `"/static/"`
        @param {string} options.root filesystem path which default
        to `process.cwd()/`.

    @return {function} express static middlewares
    **/
    serveGroupFromAppOrigin: function (metaPath, loaderConfig, fullpathResolver, options) {

        var yuiPrefix = (options && options.prefix) || "/static/",
            group,
            groupName,
            config = this.config(),
            appRootPath = (options && options.root) || (process.cwd() + '/'),
            fullpath,
            staticHandler,
            comboHandler,
            groupConfig,
            resolver;

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
        if (fullpath.indexOf(appRootPath) !== 0) {
            console.warn('Skipping meta file because [' + fullpath +
                '] is not under the app folder [' + appRootPath + ']');
            return false;
        }

        // handling over the fullpath to the group config analyzer
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

        loaderConfig = utils.extend(groupConfig, DEFAULT_COMBO_CONFIG, {
            base: yuiPrefix + groupName + "/",
            root:  groupName + "/"
        }, loaderConfig);

        // mapping all modules in the group
        this._addGroupToMap(groupName, group.modules, resolver);
        // mapping the actual meta module that is
        // not part of the `modules` for the group
        // but should be treated differently.
        group.meta = {};
        group.meta[group.moduleName] = {
            path: metaPath
        };
        this._addGroupToMap(groupName, group.meta, resolver);
        // add the meta module into the core structure
        // to make sure it gets attached to Y upfront
        this._addModuleToCore(group.moduleName);

        options = options || {};
        options.urls = this._urls[groupName];
        staticHandler = middleware['static'](appRootPath, options);

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

    @return {function} express static middlewares
    **/
    serveCombinedFromAppOrigin: function (options) {
        var path = process.cwd() + '/',
            config = this.config(),
            comboHandler,
            groups = config.groups || {},
            group,
            modules,
            mod;

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
            /* forcing combine for yui */
            config.combine = true;
            options.map.yui = {
                /* prefix used to identify files from this group */
                prefix: config.root,
                /* path to the folder that holds yui npm pkg */
                path: this.path,
                /* not need to map, just lookup in fs */
                url: undefined
            };
        }

        // build the module map for combo
        for (group in groups) {
            if (groups.hasOwnProperty(group) && fnTestGroup(groups[group])) {

                /* forcing combine for group */
                groups[group].combine = true;

                options.map[group] = {
                    /* prefix used to identify files from this group */
                    prefix: groups[group].root,
                    /* path to the app folder */
                    path: path,
                    /* forcing to map for security reasons using the precached urls */
                    urls: (this._urls && this._urls[group]) || {}
                };

            }
        }

        return middleware.combine(path, options);

    }

};
