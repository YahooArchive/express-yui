/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

var express = require('express'),
    YUI     = require('yui');

function yui(config, path) {
    var appLevelYUI;

    // getting yui.locals ready is a one time operation
    if (!yui.locals) {
        if (this.app && this.app.locals) {
            // using the app level locals to share the yui config
            yui.locals = this.app.locals.yui =
                this.app.locals.yui || {};
        } else {
            yui.locals = {};
        }
    }

    // storing references to mojito.*
    yui.app = this.app;

    config = yui.config(config);

    if (path) {
        try {
            appLevelYUI = require(path);
        } catch (e1) {
            throw new Error('Error trying to require() yui from ' +
                    'a custom path at [' + path + '].');
        }
    } else {
        // by default, we will try to pick up YUI from the app level
        // if exists.
        try {
            appLevelYUI = require(__dirname + '/../../node_modules/yui/');
        } catch (e2) {
            // app level yui not found, using the default version bundle
            // with mojito, in which case we don't need to log anything.
        }
    }

    if (appLevelYUI && YUI !== appLevelYUI) {
        YUI  = appLevelYUI;
        console.warn('Using a custom version [' + YUI.YUI.version + '] of yui from [' + YUI.path() +
                '] instead of the version bundle with `mojito-server`. ' +
                (path ? '' : 'Make you are using this intentionally, otherwise use ' +
                '`mojito.yui({}, "to/proper/yui/")` to control it.'));
    }

    // for better readibility, we expose the version
    config.version = config.version || YUI.YUI.version;

    return yui;
}

yui.cdn = function (config) {
    // it case the default local config should be overruled
    config = this.merge(this.config({
        // TODO: set yui to run from cdn in the client side
    }), config);

    return function (req, res, next) {
        // A good example of the use for this middleware is
        // the custom configuration for the CDN config when
        // running on ssl. E.g:
        // if (req.ssl) {
        //     res.locals({
        //         yui: {
        //             base: '',
        //             comboBase: ''
        //         }
        //     });
        // }
        next();
    };
};

yui.local = function (config) {
    // it case the default local config should be overruled
    config = this.merge(this.config({
        base: "/static/yui/",
        root: "/static/yui/",
        comboBase: "/combo~",
        comboSep: "~"
    }), config);

    // static handling for yui files only if this module
    // was attached to mojito-server or something similar
    if (this.app) {
        this.app.use(config.base, express['static'](YUI.path()));
    }

    return false;
    // TODO: we might need to attach something to req or res:
    // return function (req, res, next) {
    //     next();
    // };
};

yui.resolve = function (config) {
    // it case the default resolve config should be overruled
    config = this.merge(this.config({
        // TODO: set yui to resolve
    }), config);
    // TODO: generate a resolved metadata for all
    // yui modules used by the app to optimize the
    // client side computation of dependencies.

    return false;
    // TODO: we might need to attach something to req or res:
    // return function (req, res, next) {
    //     next();
    // };
};

yui.debug = function (config) {
    config = this.merge({
        debug: true,
        logLevel: 'debug',
        filter: 'debug'
    }, config || {});
    // TODO: generate a resolved metadata for all
    // yui modules used by the app to optimize the
    // client side computation of dependencies.

    return function (req, res, next) {
        res.locals.yui = yui.merge((res.locals.yui || {}), config);
        next();
    };
};

yui.config = function (config) {
    var locals = yui.locals;

    if (!locals) {
        throw new Error('mojito.yui() should happens after mojito() statement.');
    }

    if (!locals.yui) {
        locals.yui = {};
    }
    if (config) {
        this.merge(locals.yui, config);
    }
    return locals.yui;
};

yui.instance = function (extraConfig) {
    // creating a YUI instance using the default config
    // plus any extra config specified
    return YUI.YUI(this.config(), (extraConfig || {}));
};

/**
 * Merge object b with object a.
 *
 *     var a = { foo: 'bar' }
 *       , b = { bar: 'baz' };
 *
 *     utils.merge(a, b);
 *     // => { foo: 'bar', bar: 'baz' }
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api private
 */
yui.merge = function (a, b) {
    var key;
    if (a && b) {
        for (key in b) {
            a[key] = b[key];
        }
    }
    return a;
};

yui.flatten = function (b) {
    var a = this.merge({}, this.config());
    // returns a merge of {} + a: app specific + b: req specific
    return this.merge(a, b);
};

module.exports = yui;