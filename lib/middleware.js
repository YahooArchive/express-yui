/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `express-middleware` exports few middlewares that provide some basic
features to attach information into the `res.locals` object
that could be used to boot `YUI` in the client runtime.

@module express-middleware
**/

'use strict';

var utils = require('./utils'),
    debug = require('debug')('express:yui'),
    middleware = require('modown-static'),

    NODE_ENV   = process.env.NODE_ENV || 'development',
    FILTERS_MAP = {
        raw: '',
        min: '-min',
        debug: '-debug'
    },
    DEFAULT_FILTER = '-min';

/**
The `express-middleware` exports few middlewares that provide some basic
features to attach information into the `res.locals` object
that could be used to boot `YUI` in the client runtime.

    var app = express();
    app.yui.applyConfig({ fetchCSS: false });
    app.use(yui.expose());

@class middleware
@static
@uses utils, debug
@extensionfor yui
*/
module.exports = {

    /**
    Exposes `res.locals.yui_config` string with the serialized
    configuration computed based on all the calls to `app.yui.*`
    methods. This middleware will be invoked by `yui.expose` middleware
    automatically, which means you should not call it directly.

    @method exposeConfig
    @protected
    @return {function} express middleware
    **/
    exposeConfig: function () {

        var configCache;

        function composeConfigBlob(yui) {
            var config = yui.config(),
                blob = 'YUI.applyConfig(' + utils.serialize(config) + ');';
            if (config.extendedCore) {
                blob = 'YUI.Env.core.push.apply(YUI.Env.core,' +
                    utils.serialize(config.extendedCore) + ');' + blob;
            }
            return '(function(){' + blob + '}())';
        }

        return function (req, res, next) {

            var yui_config = configCache;

            // if app.yui exists, we can expose the configuration
            if (!yui_config && req.app && req.app.yui) {
                // one time operation to compute the initial configuration
                // and caching the serialized version of it
                yui_config = configCache = composeConfigBlob(req.app.yui);
            }

            // exposing the serialized version of the config
            res.locals.yui_config = yui_config;

            next();

        };

    },

    /**
    Expose the seed information to the client.
    Usually, `yui.expose()` will take care of calling
    `yui.exposeSeed()`, although you can do it directly.

    This method will expose an array through
    `res.locals.yui_seed` with the following format:

        [
            {src: "path/to/yui.js"},
            {src: "path/to/another.js"}
        ]

    In your template (assuming using handlebars):

        {{#yui_seed}}
        &lt;script src="{{{src}}}"&gt;&lt;/script&gt;
        {{/yui_seed}}

    Adjust the format if using a different template engine.

    @method exposeSeed
    @protected
    @return {function} express middleware
    **/
    exposeSeed: function () {

        var seedCache;

        function composeSeedList(yui) {
            // getting static config
            var config = yui.config(),
                modules = config.seed || yui.getDefaultSeed(),
                seedCache = [],
                groups = config.groups || {},
                prevGroup,
                stack = [],
                groupName,
                groupConfig,
                path,
                filter,
                i,
                m,
                moduleName;

            function flush(newGroup) {
                if (stack.length > 0) {
                    seedCache.push({
                        src: prevGroup.comboBase + stack.join(prevGroup.comboSep)
                    });
                }
                stack = [];
            }

            function isSimilarGroup(newGroup) {
                return newGroup && newGroup.combine && prevGroup && prevGroup.combine &&
                    newGroup.comboBase === prevGroup.comboBase &&
                    newGroup.comboSep === prevGroup.comboSep;
            }

            // producing an array of objects with the src
            // for each file in the seed.
            for (i = 0; i < modules.length; i += 1) {
                // a module in the list might have a suffix with the group name denotated as @<groupname>
                m = modules[i].split('@');
                moduleName  = m[0];
                if (m[1]) {
                    groupName   = m[1];
                    groupConfig = groups[groupName]; // group config
                } else {
                    groupName   = 'yui';
                    groupConfig = config; // core config
                }

                // computing the default filter for yui core modules
                // default is always -min
                filter = groupConfig.filter || config.filter; // inheriting from yui config
                filter = filter && FILTERS_MAP.hasOwnProperty(filter) ?
                        FILTERS_MAP[filter] : DEFAULT_FILTER;

                // just build the url as loader will do at the client side.
                path = moduleName + '/' + moduleName + filter + '.js';

                if (groupConfig) {

                    if (!isSimilarGroup(groupConfig)) {
                        flush(groupConfig);
                    }
                    if (groupConfig.combine) {
                        stack.push(groupConfig.root + path);
                    } else {
                        seedCache.push({
                            src: groupConfig.base + path
                        });
                    }
                    prevGroup = groupConfig;

                } else {

                    debug('Skipping module [' + moduleName + '] form ' +
                        'seed due to invalid group resolution.');

                }

            }

            // flushing any remaining piece in stack
            flush();

            return seedCache;
        }

        return function (req, res, next) {

            var yui_seed = seedCache;

            if (!yui_seed && req.app && req.app.yui) {
                yui_seed = seedCache = composeSeedList(req.app.yui);
            }

            res.locals.yui_seed = yui_seed;

            next();

        };

    },

    /**
    Exposes different data structures thru `res.locals.*`,
    all of them will be prefixed with `yui_` to avoid collitions.
    E.g: `res.locals.yui_seed` and `res.locals.yui_config`.
    Each of these structures could be string, array or object.

    @method expose
    @public
    @return {function[]} express middleware collection
    **/
    expose: function () {

        return [this.exposeConfig(), this.exposeSeed()];

    },

    /**
    Serves YUI Modules as static assets. All registered groups and core will be
    served if they have the proper configuration to be used from app origin.

        app.use(yui.static());

    @method static
    @public
    @param {Object} options express static handler options
    @return {Function} express middleware
    **/
    'static': function (options) {

        var staticCache;

        options = options || {};

        // Disable HTTP caching when in dev and no maxAge option is set
        if (!options.maxAge && NODE_ENV === "development") {
            options.maxAge = 0;
        }

        function composeStaticHandlers(yui) {
            var config = yui.config(),
                groups = config.groups || {},
                group,
                handlers = [],
                localGroupConfig;

            // first, yui core if it is marked as local
            if (config.local) {
                handlers.push(middleware.folder('yui', yui.path, options));
                localGroupConfig = config.combine || config;
            }

            // second, each group might be marked as local, and should be included
            for (group in groups) {
                if (groups.hasOwnProperty(group) && groups[group].local && yui._groupFolderMap && yui._groupFolderMap[group]) {
                    handlers.push(middleware.folder(group, yui._groupFolderMap[group], utils.extend({}, options)));
                    localGroupConfig = localGroupConfig || (groups[group].combine && groups[group]);
                }
            }

            // only if there is a group with local && combine, we enable the combo
            // and we will pick the comboSep & comboBase from one of those groups
            // as the basic setting for the `combine` handler.
            if (localGroupConfig) {
                handlers.push(middleware.combine(utils.extend({}, options, {
                    comboSep: localGroupConfig.comboSep,
                    comboBase: localGroupConfig.comboBase
                })));
            }

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
                handlers = staticCache = composeStaticHandlers(req.app.yui);
            }

            run(0);
        };

    }

};
