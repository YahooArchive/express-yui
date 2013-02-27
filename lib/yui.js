/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

var express = require('express'),
    expose  = require('express-expose'),
    utils   = require('./utils'),
    cdn     = require('./cdn'),
    seed    = require('./seed'),
    origin  = require('./origin');

// the actual component starts here

function yui(config, path) {

    var YUI;

    // getting yui.locals ready is a one time operation
    if (yui.locals) {
        throw new Error("Multiple attemps to call `yui()`." +
            "Only one `yui` is allow per app.");
    }

    yui.locals = {};

    config = yui.config(config);

    if (path) {
        try {
            YUI = require(path);
        } catch (e1) {
            throw new Error('Error trying to require() yui from ' + path);
        }
    } else {
        // by default, we will try to pick up `yui` package that
        // is peer to `modown-yui` package if exists.
        try {
            YUI = require(__dirname + '/../../yui');
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

yui.plug = function (app) {

    // getting yui.locals ready is a one time operation
    if (!yui.locals) {
        throw new Error("You should call `yui()` before " +
            "trying to plug the express app using `yui.plug(app)`.");
    }

    if (yui.app || !app || !app.locals) {
        throw new Error("Invalid app reference or multiple " +
            "attemps to plug the express app " +
            "thru `yui.plug(app)`. Only one " +
            "app can be plugged.");
    }

    yui.app = app;

    // using the app level locals to share the yui config
    yui.app.locals.yui = yui.locals.yui;

    return false;

};

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

yui.exposeConfig = function () {

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
        }

        next();

    };

};

yui.expose = function () {

    return [this.exposeConfig(), this.exposeSeed()];

};

utils.extend(yui, cdn, seed, origin);

module.exports = yui;
