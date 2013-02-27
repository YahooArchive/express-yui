/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

var express = require('express'),
    expose  = require('express-expose'),
    utils   = require('./utils'),
    cdn     = require('./cdn');

// the actual component starts here

function yui(config, path) {

    var YUI;

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
            YUI = require(path);
        } catch (e1) {
            throw new Error('Error trying to require() yui from ' + path);
        }
    } else {
        // by default, we will try to pick up YUI from the app level
        // if exists.
        try {
            YUI = require(__dirname + '/../../node_modules/yui');
        } catch (e) {
            throw new Error('Error trying to require() yui from the app folder. ' +
                'You can install yui at the app level or specify the path by doing ' +
                '`modown.yui({}, "to/custom/yui/")`');
        }
    }

    yui.YUI  = YUI.YUI;
    yui.version = YUI.YUI.version;
    yui.path = YUI.path();
    console.log('Using yui@' + yui.version + ' from [' +
        yui.path + '].' + (path && ' To customize this use ' +
        '`modown.yui({}, "to/custom/yui/")` to control it.'));

    // for better readibility, we expose the version
    config.version = config.version || yui.version;

    return yui;

}

yui.debug = function (config) {

    // storing static config
    yui.config({
        debug: true,
        logLevel: 'debug',
        filter: 'debug'
    }, config);

    return false;

};

yui.config = function (config) {

    var locals = yui.locals,
        args = Array.prototype.slice.call(arguments);

    if (!locals) {
        throw new Error('yui() should happen before.');
    }

    if (!locals.yui) {
        locals.yui = {};
    }
    if (config) {
        args.unshift(locals.yui);
        utils.extend.apply(utils, args);
    }

    return locals.yui;

};

yui.expose = function () {

    // getting static config
    var config = yui.config(),
        configCache,
        modules,
        mod;

    // HACK: removing fullpaths from the metas
    config = utils.clone(config);
    if (config.groups && config.groups.app && config.groups.app.modules) {
        modules = config.groups.app.modules;
        for (mod in modules) {
            if (modules.hasOwnProperty(mod)) {
                modules[mod].fullpath = undefined;
            }
        }
    }

    // caching a json string with the current config
    // note: other changes after this point will not
    // be reflected in the config that will be exposed.
    configCache = JSON.stringify(config);

    return function (req, res, next) {

        var config = JSON.parse(configCache);

        if (res.locals.yui) {
            utils.extend(config, res.locals.yui);
        }

        // if express-expose is available, we surface some entries
        if (res.expose) {
            res.expose(JSON.stringify(config), 'yui_config');
            // expose other plugins
        }

        next();

    };

};

utils.extend(yui, cdn);

module.exports = yui;
