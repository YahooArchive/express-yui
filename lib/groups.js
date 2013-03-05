/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `yui.groups` extension provides a set of features
to expose YUI groups to the client so that the loader has the
correct configuration to load required modules.

@module yui
@submodule groups
**/

'use strict';

var libfs      = require('fs'),
    libpath    = require('path'),
    libvm      = require('vm'),
    utils      = require('./utils'),
    middleware = require('./static'),

    // module scoped for reuse
    contextForRunInContext;

contextForRunInContext = libvm.createContext({
    require: require,
    module: require('module'),
    console: {
        log: function () {}
    },
    window: {},
    document: {},
    YUI: null
});

/**
The `yui.origin` extension that provides some basic configuration
that will facilitate the configuration of YUI Core modules and other
groups to be served from the express app in a form of origin server.


TODO: Docs

@class groups
@static
@uses utils, static
@extension for yui
*/
module.exports = {


    /**
    Serves YUI Core Modules from the same origin as to
    where the application is hosted.

    @method captureYUIModuleDetails
    @private
    @param {Object} loaderConfig
    @param {Object} options express static handler options
    @return {function} express static middlewares
    **/
    _captureYUIModuleDetails: function (res, runSandbox) {
        var file,
            ctx,
            yui = {};

        file = libfs.readFileSync(res.path, 'utf8');
        // console.log(file);

        contextForRunInContext.YUI = {
            ENV: {},
            config: {},
            use: function () {},
            console: {
            },
            add: function (name, fn, version, meta) {
                yui.name = name;
                yui.version = version;
                yui.meta = meta || {};
                if (!yui.meta.requires) {
                    yui.meta.requires = [];
                }
                if (runSandbox) {
                    try {
                        fn(runSandbox, yui.name);
                    } catch (e) {
                        console.error('failed to run js file: ' + res.path);
                    }
                }
            }
        };
        try {
            libvm.runInContext(file, contextForRunInContext, res.path);
        } catch (e) {
            yui = null;
            console.error('failed to parse js file: ' + res.path);
        }
        console.log(yui);
        if (yui) {
            res.yui = utils.extend(res.yui || {}, yui);
        }
    },

    /**

    @method parseGroups
    @public
    @param {String} path The path to the module JS source
    @return {Object} 
    **/
    getGroupConfig: function (path) {
        var res,
            sandbox,
            stats,
            source;

        // TODO: handle invalid path
        res = {
            path: path,
            yui: { }
        };
        sandbox = {
            Intl: {
                add: function (langFor, lang) {
                    res.yui.langFor = langFor;
                    res.yui.lang = lang;
                }
            }
        };

        this._captureYUIModuleDetails(res, sandbox);
        return res;
    }

};
