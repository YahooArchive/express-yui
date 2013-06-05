/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

/**
Utility functions used across `express-yui` components.

@module express-yui
@submodule utils
**/

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

/**
Test if `fn` is a function. This is useful to distinguish functions from objects.

@method isFunction
@param {Object|Function} fn the function to be tested
@return {Boolean} `true` if `fn` is a function, `false` otherwise
**/
exports.isFunction = function (fn) {
    return !!(fn && (Object.prototype.toString.call(fn) === '[object Function]') && fn.toString);
};

/**
Test if `re` is a regular expression.

@method isRegExp
@param {Object|Function} re the regular express to be tested
@return {Boolean} `true` if `re` is a regular express, `false` otherwise
**/
exports.isRegExp = function (re) {
   return !!(re && (Object.prototype.toString.call(re) === '[object RegExp]'));
};
