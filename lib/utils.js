/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

/**
Extends object with properties from other objects.

    var a = { foo: 'bar' }
      , b = { bar: 'baz' }
      , c = { baz: 'xyz' };

    utils.extends(a, b, c);
    // a => { foo: 'bar', bar: 'baz', baz: 'xyz' }

@method extend
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
Walks `obj` recursively looking for functions and replacing
those functions with a token that will be added to the `hash`
object. This is useful when you try to stringify an object
that helds references to functions. This method will modify
`obj` and `hash` parameters.

@method tokenizeFunctions
@param {Object} obj the object to be tokenized
@param {Object} hash the object to store tokenized functions
@param {string} ns namespace for the tokens
**/
exports.tokenizeFunctions = function (obj, hash, ns) {
    var key,
        token;

    if (!obj) { return; }

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'function') {
                token = '@' + ns + '.' + key + '@';
                hash[token] = obj[key];
                obj[key] = token;
            } else if (typeof obj[key] === 'object') {
                exports.tokenizeFunctions(obj[key], hash, ns + '.' + key);
            }
        }
    }
};

/**
Serializes an object, which is similar to `JSON.stringify` but
with the peculiarity that function refences will be allowed,
with means you can fully bake a javascript structure to be
reconstructed in the client runtime. In this method, the
original object will not be modified.

@method serialize
@param {Object} obj the object to be serialized
@return {string} the serialized object
**/
exports.serialize = function (obj) {
    var token,
        hash = {},
        str;

    obj = exports.clone(obj);
    // tokenizing functions within the obj structure
    exports.tokenizeFunctions(obj, hash, '*');
    str = JSON.stringify(obj);

    for (token in hash) {
        if (hash.hasOwnProperty(token)) {
            str = str.replace('"' + token + '"', hash[token].toString());
        }
    }

    return str;
};

/**
Deep clone of an object.

@method clone
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
