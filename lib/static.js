/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var express = require('express'),
    libfs   = require('fs'),
    libpath = require('path'),
    libutil = require('util'),

    // Default set of MIME types supported by the combo handler. Attempts to
    // combine one or more files with an extension not in this mapping (or not
    // in a custom mapping) will result in a 400 response.
    DEFAULT_MIME_TYPES = {
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
    Error.captureStackTrace(this, BadRequest);
}
libutil.inherits(BadRequest, Error);

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
    return libpath.extname(filename).toLowerCase();
}

function getFileTypes(files) {
    return dedupe(files.map(getExtName));
}

module.exports = {

    "static": function (path, config) {

        var middleware = express['static'](path, config),
            map = config && config.map;

        return function (req, res, next) {

            if ('GET' !== req.method && 'HEAD' !== req.method) {
                return next(new BadRequest('Invalid method to access static assets.'));
            }

            if (map) {

                // when map is in place, we should force the mapping
                if (req.url && map[req.url]) {
                    req.url = map[req.url];
                    middleware(req, res, next);
                } else {
                    return next(new BadRequest('File not found: ' + req.url));
                }

            } else {

                middleware(req, res, next);

            }

        };

    },

    "combine": function (path, config) {

        config = config || {};

        var maxAge    = config.maxAge,
            mimeTypes = config.mimeTypes || DEFAULT_MIME_TYPES,
            map       = config.map;

        if (typeof maxAge === 'undefined') {
            // default cache is one year
            maxAge = 31536000;
        }

        function normalize(path) {

            var group;

            for (group in map) {
                if (map.hasOwnProperty(group) &&
                        (path.indexOf(map[group].prefix) === 0)) {

                    path = path.slice(map[group].prefix.length);

                    if (map[group].urls) {
                        // we need to force mapping
                        if (path && map[group].urls[path]) {
                            return map[group].urls[path];
                        }
                    } else if (path) {
                        // we need to rely on the filesystem, no mapping
                        // is needed for this group.
                        path = libpath.join(map[group].path, path);
                        if (path.indexOf(map[group].path) === 0) {
                            // If the path is controlled, which means the url is
                            // not attempting to traverse above the root path, we
                            // are confidence that this request normalized
                            return path;
                        }
                    }

                }
            }

        }

        function finish(body, type, lastModified, res) {

            if (lastModified) {
                res.header('Last-Modified', lastModified.toUTCString());
            }

            // http://code.google.com/speed/page-speed/docs/caching.html
            if (maxAge !== null) {
                res.header('Cache-Control', 'public,max-age=' + maxAge);
                res.header('Expires', new Date(Date.now() + (maxAge * 1000)).toUTCString());
            }

            res.header('Content-Type', (type || 'text/plain') + ';charset=utf-8');
            res.body = body.join('\n');

            res.send(res.body);

        }

        return function (req, res, next) {

            var body = [],
                urls = [],
                pending,
                fileTypes,
                type,
                lastModified;

            if (req.url && req.url.indexOf(config.comboBase) === 0) {
                urls = req.url.slice(config.comboBase.length).split(config.comboSep);
            } else {
                return next();
            }

            if ('GET' !== req.method && 'HEAD' !== req.method) {
                return next(new BadRequest('Invalid method to access static assets.'));
            }

            pending = urls.length;
            fileTypes = getFileTypes(urls);
            // fileTypes array should always have one member, else error
            type = fileTypes.length === 1 && mimeTypes[fileTypes[0]];

            if (!pending) {
                // No files requested.
                return next(new BadRequest('No files requested.'));
            }

            if (!type) {
                if (fileTypes.indexOf('') > -1) {
                    // Most likely a malformed URL, which will just cause
                    // an exception later. Short-cut to the inevitable conclusion.
                    return next(new BadRequest('Truncated query parameters.'));
                } else if (fileTypes.length === 1) {
                    // unmapped type found
                    return next(new BadRequest('Illegal MIME type present.'));
                } else {
                    // A request may only have one MIME type
                    return next(new BadRequest('Only one MIME type allowed per request.'));
                }
            }

            urls.forEach(function (relativePath, i) {

                // Skip empty parameters.
                if (!relativePath) {
                    pending -= 1;
                    return;
                }

                var absolutePath = normalize(relativePath);

                // Bubble up an error if the request fails to
                // normalize the path.
                if (!absolutePath) {
                    return next(new BadRequest('File not found: ' + relativePath));
                }

                libfs.stat(absolutePath, function (err, stats) {

                    if (err || !stats.isFile()) {
                        return next(new BadRequest('File not found: ' + relativePath));
                    }

                    var mtime = new Date(stats.mtime);

                    if (!lastModified || mtime > lastModified) {
                        lastModified = mtime;
                    }

                    libfs.readFile(absolutePath, 'utf8', function (err, data) {

                        if (err) { return next(new BadRequest('Error reading file: ' + relativePath)); }

                        body[i]  = data;
                        pending -= 1;

                        if (pending === 0) {
                            finish(body, type, lastModified, res);
                        }

                    }); // fs.readFile

                }); // fs.stat

            }); // forEach

        };

    }

};