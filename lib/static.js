/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils       = require('./utils'),
    express     = require('express'),
    combo       = require('combohandler'),
    BadRequest  = combo.BadRequest,
    fs          = require('fs'),
    path        = require('path');

module.exports = {

    "static": function (path, options) {

        var middleware = express['static'](path, options),
            map = options && options.map;

        // assets are just a folder structure so we can
        // leverage the low level connect static middleware
        //return express['static'](path, options);

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

    "combine": function (path, options) {

        options = options || {};
        options.rootPath = path;

        var middleware = combo.combine(options),
            map = options && options.map;

        return function (req, res, next) {

            var i,
                paths;

            if ('GET' !== req.method && 'HEAD' !== req.method) {
                return next(new BadRequest('Invalid method to access static assets.'));
            }

            paths = req.url.split('~');

            if (map) {

                // when map is in place, we should force the mapping
                for (i = 0; i <= paths.length; i += 1) {
                    if (paths[i] && map[paths[i]]) {
                        paths[i] = map[paths[i]];
                    } else {
                        // if there is a url that is not part of
                        // the map, we should fail. if the error
                        // is in the last url from paths, it
                        // might be a truncation problem
                        // (yes, proxies and browsers might do that),
                        // which will cause an exception later.
                        return next(new BadRequest(
                            (i === paths.length - 1 ?
                                    'Truncated combo url.' :
                                    'File not found: ' + paths[i])
                        ));
                    }
                }

            }

            // combohandle npm package uses a different approach,
            // expecting querystring parameters, so we need to
            // do a little bit of transformation here.
            req.url = "?" + paths.join('=1&') + '=1';

            // delegating the process to combohandler to do the
            // low level work.
            middleware(req, res, function (err) {

                if (err) {
                    return next(err);
                }

                res.send(res.body);

            });

        };

    }

};