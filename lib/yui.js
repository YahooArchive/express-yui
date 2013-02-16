/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

var express = require('express'),
    YUI     = require('yui'),
    combo   = require('combohandler'),

    // SOME routines from rgrove/combohandler repo
    fs      = require('fs'),
    path    = require('path'),
    util    = require('util'),

    // Default set of MIME types supported by the combo handler. Attempts to
    // combine one or more files with an extension not in this mapping (or not
    // in a custom mapping) will result in a 400 response.
    MIME_TYPES = exports.MIME_TYPES = {
        '.css' : 'text/css',
        '.js'  : 'application/javascript',
        '.json': 'application/json',
        '.txt' : 'text/plain',
        '.xml' : 'application/xml'
    };


// BadRequest is used for all filesystem-related errors, including when a
// requested file can't be found (a NotFound error wouldn't be appropriate in
// that case since the route itself exists; it's the request that's at fault).
function BadRequest(message) {
    Error.call(this);
    this.name = 'BadRequest';
    this.message = message;
    Error.captureStackTrace(this, arguments.callee);
}
util.inherits(BadRequest, Error);
exports.BadRequest = BadRequest; // exported to allow instanceof checks

// -- Private Methods ----------------------------------------------------------

/**
Dedupes an array of strings, returning an array that's guaranteed to contain
only one copy of a given string.

@method dedupe
@param {String[]} array Array of strings to dedupe.
@return {Array} Deduped copy of _array_.
**/
function dedupe(array) {
    var hash    = {},
        results = [],
        hasOwn  = Object.prototype.hasOwnProperty,
        i,
        item,
        len;

    for (i = 0, len = array.length; i < len; i += 1) {
        item = array[i];

        if (!hasOwn.call(hash, item)) {
            hash[item] = 1;
            results.push(item);
        }
    }

    return results;
}

function getExtName(filename) {
    return path.extname(filename).toLowerCase();
}

function getFileTypes(files) {
    return dedupe(files.map(getExtName));
}

function combine(config) {
    var maxAge    = config.maxAge,
        mimeTypes = config.mimeTypes || MIME_TYPES;

    if (typeof maxAge === 'undefined') {
        maxAge = 31536000; // one year in seconds
    }

    return function (files, callback) {
        var body    = [],
            pending = files.length,
            fileTypes = getFileTypes(files),
            // fileTypes array should always have one member, else error
            type    = fileTypes.length === 1 && mimeTypes[fileTypes[0]],
            lastModified;

        function finish() {
            var res = {
                header: {}
            };

            if (lastModified) {
                res.header['Last-Modified'] = lastModified.toUTCString();
            }

            // http://code.google.com/speed/page-speed/docs/caching.html
            if (maxAge !== null) {
                res.header['Cache-Control'] = 'public,max-age=' + maxAge;
                res.header.Expires          = new Date(Date.now() + (maxAge * 1000)).toUTCString();
            }

            res.header['Content-Type'] = (type || 'text/plain') + ';charset=utf-8';
            res.body = body.join('\n');

            callback(null, res);
        }

        if (!pending) {
            // No files requested.
            return callback(new BadRequest('No files requested.'));
        }

        if (!type) {
            if (fileTypes.indexOf('') > -1) {
                // Most likely a malformed URL, which will just cause
                // an exception later. Short-cut to the inevitable conclusion.
                return callback(new BadRequest('Truncated url.'));
            } else if (fileTypes.length === 1) {
                // unmapped type found
                return callback(new BadRequest('Illegal MIME type present.'));
            } else {
                // A request may only have one MIME type
                return callback(new BadRequest('Only one MIME type allowed per request.'));
            }
        }

        files.forEach(function (absolutePath, i) {
            // Skip empty parameters.
            if (!absolutePath) {
                pending -= 1;
                return;
            }

            fs.stat(absolutePath, function (err, stats) {
                if (err || !stats.isFile()) {
                    return callback(new BadRequest('File not found: ' + absolutePath));
                }

                var mtime = new Date(stats.mtime);

                if (!lastModified || mtime > lastModified) {
                    lastModified = mtime;
                }

                fs.readFile(absolutePath, 'utf8', function (err, data) {
                    if (err) { return callback(new BadRequest('Error reading file: ' + absolutePath)); }

                    body[i]  = data;
                    pending -= 1;

                    if (pending === 0) {
                        finish();
                    }
                }); // fs.readFile
            }); // fs.stat
        }); // forEach
    };
}


// some utilities

function clone(oldObj) {
    var newObj,
        key,
        len;

    if (!oldObj || typeof oldObj !== 'object') {
        return oldObj;
    }

    if (Array.isArray(oldObj)) {
        newObj = [];
        len = oldObj.length;
        for (key = 0; key < len; key += 1) {
            newObj[key] = clone(oldObj[key]);
        }
        return newObj;
    }

    newObj = {};
    for (key in oldObj) {
        if (oldObj.hasOwnProperty(key)) {
            newObj[key] = clone(oldObj[key]);
        }
    }
    return newObj;
}

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
 */
function merge(a, b) {
    var key;
    if (a && b) {
        for (key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
    }
    return a;
}

// the actual component starts here

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
            appLevelYUI = require(__dirname + '/../../node_modules/yui');
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

yui.serveCoreFromCDN = function (config) {
    var version = this.config().version;
    config = merge(this.config({
        combine: true,
        debug: false,
        filter: "min",
        base: "http://yui.yahooapis.com/" + version + "/build/",
        comboBase: "http://yui.yahooapis.com/combo?",
        root: version + "/build/"
    }), config);
    return false;
};

yui.serveAppFromCDN = function (appGroupConfig) {
    var config = this.config(appGroupConfig);
    config.groups = config.groups || {};
    config.groups.app = config.groups.app || {};
    config.groups.app = merge(config.groups.app, {
        "combine"  : !!config.combine
    });
    config.groups.app = merge(config.groups.app,
            appGroupConfig || {});
    return false;
};

yui.serveCoreFromLocal = function (config) {
    // it case the default local config should be overruled
    config = merge(this.config({
        base: "/static/yui/",
        root: "/",
        comboBase: "/yui/combo~",
        comboSep: "~"
    }), config);

    // static handling for yui core modules only if this module
    // was attached to mojito-server or something similar
    if (this.app) {
        // regular requests
        this.app.use(config.base,
                express['static'](YUI.path()));
        // combined requests
        this.app.get(config.comboBase, combo.combine({rootPath:
                YUI.path()}), function (req, res) {
            res.send(res.body);
        });
    }
    return false;
};

yui.serveAppFromLocal = function (appGroupConfig) {
    var config = this.config(),
        comboMiddleware,
        map = {},
        modules,
        mod,
        yuipath,
        YUIObj = this.get();

    config.groups = config.groups || {};
    config.groups.app = config.groups.app || {};
    config.groups.app = merge(config.groups.app, {
        base     : "/static/app/",
        root     : "/",
        comboBase: "/app/combo~",
        comboSep : "~",
        combine  : !!config.combine
    });
    config.groups.app = merge(config.groups.app,
            appGroupConfig || {});

    // static handling for app yui modules only if this module
    // was attached to mojito-server or something similar
    if (this.app) {
        yuipath = YUI.path();
        comboMiddleware = combine({
            maxAge: null // TODO: control the cache somehow
        });
        modules = merge({}, config.groups.app.modules);
        for (mod in modules) {
            if (modules.hasOwnProperty(mod)) {
                modules[mod] = {
                    requires: modules[mod].requires
                };
            }
        }
        YUIObj(config, {
            useSync: true,
            modules: modules
        }).use('loader');
        modules = YUIObj.Env._renderedMods;
        for (mod in modules) {
            if (modules.hasOwnProperty(mod) && config.groups.app.modules[mod]) {
                map['/' + modules[mod].path] = modules[mod].fullpath;
            }
        }

        // regular requests
        this.app.use(config.groups.app.base, function (req, res, next) {
            // hack to support -debug
            req.url = req.url.replace('-debug', '-min');
            if (req.url && map[req.url]) {
                comboMiddleware([map[req.url]], function (err, data) {
                    var h;
                    if (err) {
                        next(err);
                    } else {
                        for (h in data.header) {
                            if (data.header.hasOwnProperty(h)) {
                                res.header(h, data.header[h]);
                            }
                        }
                        res.send(data.body);
                    }
                });
            } else {
                next(new Error('File not found'));
            }
        });
        // combined requests
        if (config.groups.app.comboSep && config.groups.app.comboBase) {
            this.app.use(config.groups.app.comboBase, function (req, res, next) {
                var files = req.url && req.url.split(config.groups.app.comboSep),
                    f;

                if (files && files.length > 0) {
                    for (f = 0; f < files.length; f += 1) {
                        // hack to support -debug
                        files[f] = files[f].replace('-debug', '-min');
                        if (map[files[f]]) {
                            files[f] = map[files[f]];
                        } else {
                            next(new Error('Invalid combo url'));
                            return;
                        }
                    }
                    comboMiddleware(files, function (err, data) {
                        var h;
                        if (err) {
                            next(err);
                        } else {
                            for (h in data.header) {
                                if (data.header.hasOwnProperty(h)) {
                                    res.header(h, data.header[h]);
                                }
                            }
                            res.send(data.body);
                        }
                    });
                } else {
                    next(new Error('File not found'));
                }
            });
        }
    }
    return false;
};

yui.resolve = function (config) {
    // it case the default resolve config should be overruled
    config = merge(this.config({
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

yui.get = function () {
    var config = this.config(),
        yuipath = YUI.path();

    return require(path.join(yuipath, (config.filter === 'debug' ? 'debug' : 'index'))).YUI;
};

yui.debug = function (config) {
    config = merge({
        debug: true,
        logLevel: 'debug',
        filter: 'debug'
    }, config || {});
    // TODO: generate a resolved metadata for all
    // yui modules used by the app to optimize the
    // client side computation of dependencies.

    return function (req, res, next) {
        res.locals.yui = merge((res.locals.yui || {}), config);
        next();
    };
};

yui.config = function (config) {
    var locals = yui.locals;

    if (!locals) {
        throw new Error('yui() should happen before.');
    }

    if (!locals.yui) {
        locals.yui = {};
    }
    if (config) {
        merge(locals.yui, config);
    }
    return locals.yui;
};

yui.expose = function (req, res, next) {
    var a = merge({}, this.config()),
        b = res.locals.yui || {},
        config = merge(clone(a), b),
        modules,
        mod;

    // HACK: removing fullpaths from the metas
    // TODO: this should be a one time operation
    if (config.groups && config.groups.app && config.groups.app.modules) {
        modules = config.groups.app.modules;
        for (mod in modules) {
            if (modules.hasOwnProperty(mod)) {
                modules[mod].fullpath = undefined;
            }
        }
    }
    res.expose(JSON.stringify(config), 'yui_config');

    // producing seed files
    res.locals.yui_seed = [
        {
            src: config.base + 'yui/yui-' +
                (config.filter === 'debug' ? 'debug' : 'min') + '.js'
        }
    ];

    next();
};

module.exports = yui;