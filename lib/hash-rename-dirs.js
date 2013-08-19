/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs'),
    path = require('path'),
    hashfile = require('./hashfile'),

    IS_MODULE_RE = /^[\w\-]+$/;


function hashpath(modulePath, hash) {
    return modulePath + '-' + hash.slice(0,6);
}

/**
 * Append a crypto-hash to every YUI module sub-directory. Hash is calculated
 * for a single module file as specified by suffix, like "-min.js".
 *
 * This function is essentially the same as hashfiles.js. Please refer to it for
 * examples of the parameters returned to the callback.
 *
 * @param {string} dir Full path to shifter's build directory
 * @param {string} suffix The suffix (like '-min.js') of the shifter-generated
 * module file to generate a hash.
 * @param {string} algo Hashing algorithm, i.e. 'md5', 'sha1'… See hashfile.js
 * @param {function} callback
 *
 * @example: renaming yui module dirs on the filesystem using:
 *
 *   hashfiles('path/to/build/demo', '-min.js', 'md5', callback):
 *
 * before:
 *   build/demo/
 *   ├── alerts-model
 *   │   ├── alerts-model-debug.js
 *   │   ├── alerts-model-min.js
 *   │   └── alerts-model.js
 *   ├── binder-index
 *   │   ├── binder-index-debug.js
 *   │   ├── binder-index-min.js
 *   │   └── binder-index.js
 *
 * after:
 *   build/demo/
 *   ├── alerts-model-5a2595
 *   │   ├── alerts-model-debug.js
 *   │   ├── alerts-model-min.js    <- md5 is 5a25958f7c9bd845d23b0ebf84257fb1
 *   │   └── alerts-model.js
 *   ├── binder-index-4e5576
 *   │   ├── binder-index-debug.js
 *   │   ├── binder-index-min.js    <- md5 is 4e5576ad323511fe16bcff59df25f61f
 *   │   └── binder-index.js
 */
function hashfiles(dir, suffix, algo, callback) {
    var hashes = {},
        invalid = {},
        count = 0;

    function isDone(err) {
        return function() {
            count--;
            if (err) {
                callback(err); // fs.rename error
            } else if(!count) {
                callback(null, hashes, invalid);
            }
        }
    }

    function afterHash(err, hash, pathname) {
        var moddir,
            modname;

        if (err) {
            // Error codes ENOENT and ENOTDIR are expected for pathnames that
            // aren't YUI module directories, since the build directory can
            // contain non-Shifter generated artifacts (vis locator-micro).
            // We could do some checking for these cases, if it's worth the
            // extra fs.stat. But it should be obvious from err.path.
            invalid[err.path] = err.code;
            isDone();

        } else {
            moddir = path.dirname(pathname);
            modname = path.basename(moddir);

            // save file hash
            hashes[modname] = hash;

            // rename the module directory
            fs.rename(moddir, hashpath(moddir, hash), isDone(err));
        }
    }

    function eachFile(dir, suffix, cb) {
        return function (item) {
            var pathname = path.join(dir, item, item + suffix);

            if (IS_MODULE_RE.test(item)) {
                count++;
                hashfile(pathname, algo, cb);

            } else {
                invalid[path.join(dir, item)] = 'skipped';
            }
        };
    }

    function afterReaddir(err, files) {
        if (err) {
            callback(err, null);
        }
        files.forEach(eachFile(dir, suffix, afterHash));
    }

    fs.readdir(dir, afterReaddir);
}


module.exports = hashfiles;
module.exports.hashpath = hashpath;
