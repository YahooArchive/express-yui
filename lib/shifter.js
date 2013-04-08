/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true */

"use strict";

var fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    existsSync = fs.existsSync || path.existsSync,
    vm = require('vm'),
    shifterCLI = path.join(__dirname, '../node_modules/shifter/bin/shifter'),
    loaderPlugin,
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
        metas = path.join(path.dirname(file) + 'meta'),
        files,
        i;

    try {
        mod = JSON.stringify(source);
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
                    entry = require(f);
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

module.exports = {

    locatorShifter: function (options) {

        var yui = this;

        options = options || {};

        return {

            describe: utils.extend({
                summary: 'Shifter plugin for yui modules',
                extensions: ['js', 'json'],
                shifterBuildArgs: ['--no-coverage', '--no-lint', '--silent', '--quiet', '--no-global-config']
            }, options),

            fileUpdated: function (meta, api) {
                var self = this,
                    source_path = meta.fullPath,
                    bundleName = meta.bundleName,
                    bundle = api.getBundle(meta.bundleName),
                    mod,
                    contents;

                if (meta.ext === 'json' && path.basename(source_path) !== 'build.json') {
                    api.log('Skipping json file that is not a shifter build ' + source_path, 'debug', 'modown-yui');
                    return;
                }

                // TODO: make this async
                contents = fs.readFileSync(source_path, 'utf8');

                mod = (meta.ext === 'json' ? checkBuildFile : checkYUIModule)(contents, source_path);

                if (!mod) {
                    api.log('ignoring ' + source_path, 'debug', 'modown-yui');
                    return;
                }

                if (!bundle.yuiBuildDirectory) {
                    // augmenting bundle obj with more metadata about bundle
                    bundle.yuiBuildDirectory = path.resolve(bundle.buildDirectory,
                            options.yuiBuildDirectory || 'yui-build');
                }

                // TODO: we should register in loader only after shifter finished
                yui.register(bundleName, source_path, mod);

                return api.promise(function (fulfill, reject) {

                    var spawn = require('win-spawn'),
                        skip,
                        args;

                    api.storeInCache(source_path, contents).then(function (cache) {

                        if (cache && !cache.updated) {
                            api.log('skipping ' + source_path, 'debug', 'modown-yui');
                            fulfill();
                            return;
                        }

                        args = [
                            shifterCLI,
                            "--build-dir", bundle.yuiBuildDirectory,
                            (meta.ext === '.js' ? '--yui-module' : '--config'), source_path
                        ].concat(self.describe.shifterBuildArgs);

                        api.log('shifting ' + meta.fullPath, 'debug', 'modown-yui');

                        var child = spawn(process.argv[0], args, {
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

                    }, reject);

                });

            }

        };

    }

};