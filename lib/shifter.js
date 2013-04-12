/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true */

/**
The `yui.shifter` extension exposes a locator plugin to build yui modules
from *.js or build.json files.

@module yui
@submodule shifter
**/

'use strict';

var fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    existsSync = fs.existsSync || path.existsSync,
    vm = require('vm'),
    spawn = require('win-spawn'),
    shifterCLI = path.join(__dirname, '../node_modules/shifter/bin/shifter'),
    NODE_ENV   = process.env.NODE_ENV || 'development',
    contextForRunInContext = vm.createContext({
        require: require,
        module: require('module'),
        console: {
            log: function () {}
        },
        window: {},
        document: {}
    });

function checkBuildFile(source, file) {
    var mod,
        entry,
        metas = path.join(path.dirname(file), 'meta'),
        files,
        i;

    try {
        mod = JSON.parse(source);
    } catch (e) {
        console.error('Failed to parse build file: ' + file);
        console.error(e);
        return;
    }

    mod.buildfile = file;

    if (existsSync(metas)) {
        files = fs.readdirSync(metas);
        files.forEach(function (f) {
            var i;
            if (path.extname(f) === '.json') {
                try {
                    entry = require(path.join(metas, f));
                } catch (e) {
                    console.error('Failed to parse meta file: ' + f);
                    console.error(e);
                    return;
                }
                for (i in entry) {
                    if (entry.hasOwnProperty(i)) {
                        mod.builds[i] = mod.builds[i] || {};
                        mod.builds[i].config = entry[i];
                    }
                }
            }
        });
    }
    return mod;
}

function checkYUIModule(source, file) {
    var mod;

    contextForRunInContext.YUI = {
        add: function (name, fn, version, config) {
            if (!mod) {
                mod = {
                    name: name,
                    buildfile: file,
                    builds: {}
                };
            }
            mod.builds[name] = {
                name: name,
                config: config || {}
            };
        }
    };
    try {
        vm.runInContext(source, contextForRunInContext, file);
    } catch (e) {
        return;
    }
    return mod;
}

/**
The `yui.shifter` extension exposes a locator plugin to build yui modules
from *.js or build.json files.

Here is an example:

    var plugin = yui.locatorShifter({});

You can also specify a custom yui build directory, by doing:

    var plugin = yui.locatorShifter({
        yuiBuildDirectory: '/path/to/folder'
    });

@class shifter
@static
@uses *path, *fs, *module, *vm, utils, win-spawn, shifter, loader
@extensionfor yui
*/
module.exports = {

    /**
    Creates a locator plugin that can analyze .js and .json files and try to build
    them into yui modules.

    @method locatorShifter
    @public
    @param {Object} options Optional plugin configuration
    objects that, if passed, will be mix with the default
    configuration of the plugin.

        @param {string} yuiBuildDirectory Optional custom path for the output of the shifter

    @return {object} locator plugin
    **/
    locatorShifter: function (options) {

        var yui = this;

        options = options || {};

        return {

            describe: utils.extend({
                summary: 'Shifter plugin for yui modules',
                extensions: ['js', 'json'],
                shifterBuildArgs: ['--no-coverage', '--no-lint', '--silent', '--quiet', '--no-global-config']
            }, options),

            fileUpdated: function (evt, api) {
                var self = this,
                    meta = evt.file,
                    source_path = meta.fullPath,
                    bundleName = meta.bundleName,
                    bundle = api.getBundle(meta.bundleName),
                    mod,
                    contents;

                if (meta.ext === 'json' && path.basename(source_path) !== 'build.json') {
                    // Skipping json file that are not a shifter build.json
                    return;
                }

                // TODO: make this async
                contents = fs.readFileSync(source_path, 'utf8');

                mod = (meta.ext === 'json' ? checkBuildFile : checkYUIModule)(contents, source_path);

                if (!mod) {
                    console.log('[modown-yui] ignoring ' + source_path);
                    return;
                }

                if (!bundle.yuiBuildDirectory) {
                    // augmenting bundle obj with more metadata about bundle
                    bundle.yuiBuildDirectory = path.resolve(bundle.buildDirectory,
                            options.yuiBuildDirectory || 'yui-build');
                }

                // TODO: we should register in loader only after shifter finished
                yui.register(bundleName, source_path, mod);

                // skip any spawn for shifter when in production mode
                // TODO: once screwdriver supports the proper ENV configuration, we can uncomment this
                // if (NODE_ENV === "production") {
                //  console.log('modown-yui] skipping shifter in production environments.');
                //  return;
                // }

                return api.promise(function (fulfill, reject) {
                    var args,
                        child;

                    console.log('[modown-yui] shifting ' + meta.fullPath);

                    args = [
                        shifterCLI,
                        "--build-dir", bundle.yuiBuildDirectory,
                        (meta.ext === '.js' ? '--yui-module' : '--config'), source_path
                    ].concat(self.describe.shifterBuildArgs);

                    child = spawn(process.argv[0], args, {
                        cwd: path.dirname(source_path),
                        stdio: 'inherit'
                    });
                    child.on('exit', function (code) {
                        if (code) {
                            reject(new Error(meta.fullPath + ": shifter compiler error: " + code + '\n' +
                                ' while executing: \n' + args.join(' ')));
                            return;
                        }
                        fulfill();
                    });

                });

            }

        };

    }

};