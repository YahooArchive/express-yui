/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
Utility functions used across `express-yui` components.

@module express-yui/lib/utils
**/

'use strict';

var NODE_ENV = process.env.NODE_ENV || 'development',
    RE_TRAILING_SLASH = /\/$/;

/**
Exports few utility methods and constants for `express-yui` components.

@class utils
@static
*/

/**
Extends object with properties from other objects.

    var a = { foo: 'bar' }
      , b = { bar: 'baz' }
      , c = { baz: 'xyz' };

    utils.extends(a, b, c);
    // a => { foo: 'bar', bar: 'baz', baz: 'xyz' }

@method extend
@static
@param {Object} obj the receiver object to be extended
@param {Object*} supplier objects
@return {Object} The extended object
**/
exports.extend = function (obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
        var key;

        if (!source) { return; }

        for (key in source) {
            if (source.hasOwnProperty(key)) {
                obj[key] = source[key];
            }
        }
    });

    return obj;
};

/**
Deep clone of an object.

@method clone
@static
@param {Object} oldObj the origal object to be cloned
@return {Object} The cloned object
**/
exports.clone = function clone(oldObj) {
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
};

/**
Minify the body of a function by removing spaces, tabs, comments, breaklines, etc.
This is specially useful to optimize the function before serializing it to send
it to the client side as a js blob.

@method minifyFunction
@static
@param {Function} fn the function to minify
@return {Function} the minified function
**/
exports.minifyFunction = function (fn) {
    var fnString = fn.toString(),
        forcingFunctionEval = Function; // f**k you jshint!
    // removing comments (http://upshots.org/javascript/javascript-regexp-to-remove-comments)
    fnString = fnString.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '');
    // removing breaklines, tabs and spaces
    fnString = fnString
        .replace(/\r\n/g, '')
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(/\t/g, '')
        .replace(/\ +/g, ' ');

    return forcingFunctionEval('return ' + fnString)();
};

/**
Utility method to use the loader base and add the folder name that represents
a group to complete the new base and root value for each custom group.

    utils.joinURLFolder('http://foo.com/bar', 'baz');  // => http://foo.com/bar/baz/
    utils.joinURLFolder('https://foo.com/bar', 'baz'); // => https://foo.com/bar/baz/
    utils.joinURLFolder('//foo.com/bar/', 'baz');      // => //foo.com/bar/baz/
    utils.joinURLFolder('/bar', 'baz');                // => /bar/baz/

@method joinURLFolder
@static
@param {string} url the url that should get the new segment added at the end
@return {string} folderName the string that represents the segment to be added
@return {string} the new url
**/
exports.joinURLFolder = function (url, folderName) {
    return (url || '').replace(RE_TRAILING_SLASH, '') + '/' + folderName + '/';
};

/**
The default combo handler configuration for app origin.

@property DEFAULT_COMBO_CONFIG
@static
@type {Object}
**/
exports.DEFAULT_COMBO_CONFIG = {
    maxURLLength: 1024,
    comboBase: "/combo?",
    comboSep: "&"
};

/**
Whether the app is running in debug mode or not. True if nodejs is running
in development mode.

@property debugMode
@static
@type {Boolean}
**/
exports.debugMode = (NODE_ENV === 'development');
