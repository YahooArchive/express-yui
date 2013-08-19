/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs'),
    dirname = require('path').dirname,
    exec = require('child_process').exec;


/**
 * get the short git sha for a pathname
 * @param {string} pathname the path to a file or directory
 * @param {function} callback
 * @example
 *      gitsha('path/to/file', console.log);
 *      // outputs something like -> null 'cfd1b00'
 */
function gitsha(pathname, callback) {
    // %h: short commit hash, %t: short tree hash
    var cmd = 'git log -1 --format="%h" -- ' + pathname;

    function afterStat(err, stat) {
        var cwd;

        if (err) {
            // file not accessible
            callback(err, null);
        } else {
            // get cwd for the git sub-process
            cwd = stat.isDirectory() ? pathname : dirname(pathname);

            // get trimmed git command results
            exec(cmd, {cwd: cwd}, function (err, stdout, stderr) {
                /*jshint unused:vars */
                callback(err, err ? null : stdout.toString().trim());
            });
        }
    }

    // stat first for existence and isDirectory() check
    fs.stat(pathname, afterStat);
}

module.exports = gitsha;
