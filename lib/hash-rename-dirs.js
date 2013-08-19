/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs'),
    path = require('path'),
    hashfile = require('./hashfile');


function namer(modulePath, hash) {
    return modulePath + '@' + hash.slice(0,6);
}

/**
 * Append a crypto-hash to every YUI module sub-directory. Hash is calculated
 * for a single module file as specified by suffix, like "-min.js".
 *
 * This function is essentially the same as hashfiles.js. Please refer to it for
 * examples of the parameters returned to the callback.
 *
 * @async
 * @param {string} dir Full path to shifter's build directory
 * @param {object} options
 *   @param {string} options.algo Hashing algorithm. Default is 'md5'.
 *   @param {string} options.suffix Suffix of the module file to hash. Default
 *   is '-min.js', so code comments do not trigger a new hash stamp.
 *   @param {regex} options.pattern Regex to use to filter possible module
 *   directory names. Default is /^[\w\-]+$/. To skip `fs.stat` on other
 *   locator plugin artifacts.
 *   @param {function} options.renamer
 *     @param {string} modulePath Full path to existing module directory
 *     before it is renamed.
 *     @param {string} hash The hash of the module file contents.
 *     @return {string} Full path of renamed module directory.
 * @param {function} callback
 *   @param {error} Error object from fs.rename()
 *   @param {object} Object with module name as key, hash as value.
 *   @param {object} Object with full path of file or directory as key, error
 *   code as value.
 *
 * @example: renaming yui module dirs on the filesystem using based on the md5
 * hash of the <module name>/<module name> + 'min.js' file contents.
 *
 *   hashfiles('path/to/build/demo', {}, callback):
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
 *   ├── alerts-model@5a2595
 *   │   ├── alerts-model-debug.js
 *   │   ├── alerts-model-min.js    <- md5 is 5a25958f7c9bd845d23b0ebf84257fb1
 *   │   └── alerts-model.js
 *   ├── binder-index@4e5576
 *   │   ├── binder-index-debug.js
 *   │   ├── binder-index-min.js    <- md5 is 4e5576ad323511fe16bcff59df25f61f
 *   │   └── binder-index.js
 */
function hashfiles(dir, options, callback) {
    var hashes = {},
        invalid = {},
        count = 0,
        opts = {
            algo: options.algo || 'md5',            // see crypto.getHashes()
            suffix: options.suffix || '-min.js',    // module file suffix
            pattern: options.pattern || /^[\w\-]+$/,// module dirname regex
            namer: options.namer || namer           // makes new module dirname
        };

    function isDone(err) {
        return function() {
            count--;
            if (err) {
                callback(err); // fs.rename error
            } else if(!count) {
                callback(null, hashes, invalid);
            }
        };
    }

    function afterHash(err, hash, pathname) {
        var moddir,
            modname,
            newpath;

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
            newpath = opts.namer(moddir, hash);

            // save module name and it's new path
            hashes[modname] = newpath;

            // rename the module directory
            fs.rename(moddir, newpath, isDone(err));
        }
    }

    function eachFile(dir, suffix, cb) {
        return function (item) {
            // shifter-created artifacts are like: buildDir/name/name + suffix
            var pathname = path.join(dir, item, item + suffix);

            if (opts.pattern.test(item)) {
                // item appears to be a valid yui-module name
                count++;
                hashfile(pathname, opts.algo, cb);

            } else {
                invalid[path.join(dir, item)] = 'skipped';
            }
        };
    }

    function afterReaddir(err, files) {
        if (err) {
            callback(err, null);
        } else {
            files.forEach(eachFile(dir, opts.suffix, afterHash));
        }
    }

    fs.readdir(dir, afterReaddir);
}

module.exports = hashfiles;
