/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

/**
Extends object with properties from other objects.
<pre>
    var a = { foo: 'bar' }
      , b = { bar: 'baz' }
      , c = { baz: 'xyz' };

    utils.extends(a, b, c);
    // a => { foo: 'bar', bar: 'baz', baz: 'xyz' }
</pre>
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
Merge object b with object a.
<pre>
    var a = { foo: 'bar' }
      , b = { bar: 'baz' };

    utils.merge(a, b);
    // => { foo: 'bar', bar: 'baz' }
</pre>
@param {Object} a the receiver
@param {Object} b the supplier
@return {Object} The modified object `a`
**/
exports.merge = function(a, b) {
    var key;
    if (a && b) {
        for (key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
    }
    return a;
};

/**
Default set of MIME types supported by the static handler.

@property MIME_TYPES
**/
exports.MIME_TYPES = {
    '.css' : 'text/css',
    '.js'  : 'application/javascript',
    '.json': 'application/json',
    '.txt' : 'text/plain',
    '.xml' : 'application/xml'
};

/**
Dedupes an array of strings, returning an array that's
guaranteed to contain only one copy of a given string.

@method dedupe
@param {String[]} arr Array of strings to dedupe.
@return {Array} Deduped copy of _array_.
**/
exports.dedupe = function (arr) {
    var hash    = {},
        results = [],
        hasOwn  = Object.prototype.hasOwnProperty,
        i,
        item,
        len;

    for (i = 0, len = arr.length; i < len; i += 1) {
        item = arr[i];

        if (!hasOwn.call(hash, item)) {
            hash[item] = 1;
            results.push(item);
        }
    }

    return results;
};