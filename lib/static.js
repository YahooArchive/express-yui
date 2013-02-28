/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils   = require('./utils'),
    express = require('express'),
    fs      = require('fs'),
    path    = require('path');

module.exports = {

    "static": function (modules, options) {

        return function (req, res, next) {

            next();

        };

    },

    "combine": function (modules, options) {

        return function (req, res, next) {

            next();

        };

    }

};