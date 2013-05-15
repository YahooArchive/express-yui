/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true, stupid: true */

/**
The `express-yui.shifter` extension exposes a set of utilities to build yui modules
from *.js or build.json files.

@module yui
@submodule shifter
**/

'use strict';

var libfs = require('fs'),
    libmkdirp = require('mkdirp'),
    libpath = require('path'),
    utils = require('./utils'),
    existsSync = libfs.existsSync || libpath.existsSync,
    vm = require('vm'),
    spawn = require('win-spawn'),
    shifterCLI = libpath.join(__dirname, '../node_modules/shifter/bin/shifter'),
    NODE_ENV   = process.env.NODE_ENV || 'development',
    contextForRunInContext = vm.createContext({
        require: require,
        module: require('module'),
        console: {
            log: function () {}
        },
        window: {},
        document: {}
    }),
    TEMPLATE_TOKEN = '{ /* METAGEN */ }',
    crypto = require('crypto'),
    md5 = function (str) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(str);
        return md5sum.digest('hex');
    };

function isFunction(fn) {
    return !!(fn && (Object.prototype.toString.call(fn) === '[object Function]') && fn.toString);
}

function Builder(options) {
    this.name = options.name;
    this.group = options.group;
    this.data = {
        json: {},
        conds: {},
        files: null,
        mods: []
    };
}

Builder.prototype = {
    compile: function (mods) {
        this.process(mods);
        this.produceJSON();
        this.conditionals();
        this.produceJS();
    },
    process: function (mods) {
        var self = this;
        Object.keys(mods).forEach(function (key) {
            var mod = mods[key],
                i;
            for (i in mod.builds) {
                if (mod.builds.hasOwnProperty(i)) {
                    self.parseData(i, mod.builds[i].config || {}, mod.buildfile);
                }
            }
        });
    },
    parseData: function (name, data, file) {
        var i, o;
        for (i in data) {
            if (data.hasOwnProperty(i)) {
                if (i === 'submodules' || i === 'plugins') {
                    for (o in data[i]) {
                        if (data[i].hasOwnProperty(o)) {
                            this.parseData(o, data[i][o], file);
                        }
                    }
                    delete data[i];
                }
                if (i === 'condition') {
                    if (data[i].test && (isFunction(data[i].test) || libpath.extname(data[i].test) === '.js')) {
                        this.data.conds[name] = data[i].test;
                    }
                    data[i].name = name;
                    data[i] = this.sortObject(data[i]);
                }
            }
        }
        if (this.group) {
            data.group = this.group;
        }
        this.data.json[name] = this.sortObject(data);
    },
    sortObject: function (data) {
        var keys = Object.keys(data).sort(),
            d = {};
        keys.forEach(function (k) {
            d[k] = data[k];
        });
        return d;
    },
    conditionals: function () {
        var tests = [],
            allTests = [],
            jsonStr,
            self = this;

        Object.keys(this.data.json).forEach(function (name) {
            var mod = self.data.json[name],
                cond,
                cName,
                test;
            if (mod.condition) {
                cond = self.sortObject(mod.condition);
                if (self.data.conds[mod.condition.name]) {
                    cName = mod.condition.name;
                    test = self.data.conds[cName];
                    if (test && isFunction(test)) {
                        mod.condition.test = md5(mod.condition.name);
                        cond.test = test.toString();
                        tests.push({ key: mod.condition.test, test: cond.test });
                    } else if (existsSync(test)) {
                        mod.condition.test = md5(mod.condition.name);
                        // TODO: make this async and remove the stupid flag
                        cond.test = test = libfs.readFileSync(test, 'utf8');
                        tests.push({ key: mod.condition.test, test: cond.test });
                    } else {
                        throw new Error('Failed to locate test file: ' + test);
                    }
                }
                allTests.push(cond);
            }
        });

        jsonStr = JSON.stringify(this.data.json, null, 4);

        tests.forEach(function (info) {
            jsonStr = jsonStr.replace('"' + info.key + '"', info.test);
        });

        jsonStr = jsonStr.replace(/\}\n,/g, '},').replace(/\}\n\n,/g, '},');

        this.data.jsonStr = jsonStr;
        this.data.tests = allTests;

    },
    produceJSON: function () {
        this.data.json = this.sortObject(this.data.json);
    },
    produceJS: function () {
        this.data.js = this.header().replace(TEMPLATE_TOKEN, this.data.jsonStr);
    },
    header: function () {
        var str = [
            '/* This file is auto-generated by locator plugin modown-yui for bundle ' + this.group + ' */',
            '',
            '/*jshint maxlen:900, eqeqeq: false */',
            '',
            '/**',
            ' * YUI 3 module metadata',
            ' * @module ' + this.name,
            ' */'
        ];

        str.push('YUI.Env[Y.version].modules = YUI.Env[Y.version].modules || {};');
        str.push('Y.mix(YUI.Env[Y.version].modules, { /* METAGEN */ });');

        str.unshift('YUI.add("' + this.name + '", function(Y, NAME) {');
        str.push('}, "", {requires: ["loader-base"]});');

        return str.join('\n');
    }
};

/**
The `express-yui.shifter` extension exposes a locator plugin to build yui modules
from *.js or build.json files.

Here is an example:

    var plugin = app.yui.locatorShifter({});

You can also specify a custom yui build directory, by doing:

    var plugin = app.yui.locatorShifter({
        yuiBuildDirectory: '/path/to/folder'
    });

@class shifter
@static
@uses *path, *fs, *module, *vm, utils, win-spawn, shifter, loader
@extensionfor yui
*/
module.exports = {

    /**
    Shift yui modules using shifter cli.

    @method shiftFiles
    @public
    @param {array} files filesystem paths for all files to be shifted
    @param {object} options configuration

        @param {string} options.buildDir custom path for the output of the shifter
        @param {boolean} options.cache whether or not we should apply cache to speed up
            the shifting process. If true, it will create the folder `.cache` and generate
            some hash to prevent shifting the same *.js files if there is not change in
            the source.
        @param {array}  options.args shifter cli build arguments, it defaults to `[]`

    @param {function} callback the callback method to signal the end of the operation
    **/
    shiftFiles: function (files, options, callback) {

        var self = this,
            queue = [].concat(files),
            args,
            child,
            i;

        if (NODE_ENV === "production") {
            console.log('[modown-yui] skipping shifter in production environments.');
            if (callback) { callback(null); }
            return;
        }

        options = options || {};

        function next() {

            var file = queue.shift();

            if (file) {

                console.log('[modown-yui] shifting ' + file);

                if (options.cache && self._isCached(file, options.buildDir)) {
                    next();
                    return;
                }

                args = [
                    shifterCLI,
                    "--build-dir", options.buildDir,
                    (libpath.extname(file) === '.js' ? '--yui-module' : '--config'), file
                ].concat(options.args || []);

                child = spawn(process.argv[0], args, {
                    cwd: libpath.dirname(file),
                    stdio: 'inherit'
                });
                child.on('exit', function (code) {
                    if (code) {
                        callback(new Error(file + ": shifter compiler error: " + code + '\n' +
                            ' while executing: \n' + args.join(' ')));
                        return;
                    }
                    next(); // next item in queue to be processed
                });

            } else {
                if (callback) { callback(null); }
            }

        }

        next(); // kick off the queue process

    },

    /**
    Analyze a build.json file to extract all the important metadata associted with it.

    @method _checkBuildFile
    @protected
    @param {string} file The filesystem path for the build.json file to be analyzed
    @return {object} The parsed and augmented content of the build.json file
    **/
    _checkBuildFile: function (file) {
        var mod,
            entry,
            metas = libpath.join(libpath.dirname(file), 'meta'),
            files,
            i,
            j,
            f;

        try {
            mod = JSON.parse(libfs.readFileSync(file, 'utf8'));
        } catch (e1) {
            console.error('Failed to parse build file: ' + file);
            console.error(e1);
            return;
        }

        if (!mod.builds) {
            console.error('Invalid meta file: ' + file);
            return;
        }

        mod.buildfile = file;

        if (existsSync(metas)) {
            files = libfs.readdirSync(metas);
            for (i = 0; i < files.length; i += 1) {
                f = files[i];
                if (libpath.extname(f) === '.json') {
                    try {
                        entry = JSON.parse(libfs.readFileSync(libpath.join(metas, f), 'utf8'));
                    } catch (e2) {
                        console.error('Failed to parse meta file: ' + f);
                        console.error(e2);
                        return;
                    }
                    for (j in entry) {
                        if (entry.hasOwnProperty(j)) {
                            mod.builds[j] = mod.builds[j] || {};
                            mod.builds[j].config = entry[j];
                            // setting the proper filename for test if needed
                            if (entry[j] && entry[j].condition && entry[j].condition.test &&
                                    libpath.extname(entry[j].condition.test) === '.js') {
                                entry[j].condition.test = libpath.join(metas, entry[j].condition.test);
                            }
                        }
                    }
                }
            }
        }
        return mod;
    },

    /**
    Analyze a javascript file, if it is a yui module, it extracts all the important metadata
    associted with it.

    @method _checkYUIModule
    @protected
    @param {string} file The filesystem path for the yui module to be analyzed
    @return {object} The parsed and augmented metadata from the yui module
    **/
    _checkYUIModule: function (file) {
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
                // detecting affinity from the filename
                if (file.indexOf('.server.js') === file.length - 10) {
                    mod.builds[name].config.affinity = 'server';
                }
                if (file.indexOf('.client.js') === file.length - 10) {
                    mod.builds[name].config.affinity = 'client';
                }
            }
        };
        try {
            vm.runInContext(libfs.readFileSync(file, 'utf8'), contextForRunInContext, file);
        } catch (e) {
            return;
        }
        return mod;
    },

    /**
    Verifies if a source file was already processed by analyzing its content against an
    internal cache mechanism. JSON files (*.json) are an exception, and they will not be
    cached since they might includes other files that might change and affects the result
    of the build so we can't rely on the source file alone. If the file is not in cache,
    it will be included automatically.

    Why? This method is just an artifact to avoid spawning a process to execute shifter, which
    is very expensive. It is also the main artifact to avoid shifting files when in production,
    if the build process includes the build folder, specially because manhattan does not
    support spawn. Finally, it is just a noop artifact to avoid calling shifter, it does not
    need to cache the response of the shifter process, just opt out for the next call to shift
    the same file with the same content.

    @method _isCached
    @protected
    @param {string} file The filesystem path for the file to be cached
    @param {string} buildDir The filesystem path for the build folder
    @return {boolean} `true` if the file and its content matches the internal cache, otherwise `false`.
    **/
    _isCached: function (file, buildDir) {
        var fileHash,
            data;
        if (libpath.extname(file) !== '.json') {
            fileHash = libpath.join(buildDir, '.cache', md5(file));
            data = libfs.readFileSync(file, 'utf8');
            if (existsSync(fileHash) && (libfs.readFileSync(fileHash, 'utf8') === data)) {
                return true;
            }
            libmkdirp.sync(libpath.join(buildDir, '.cache'));
            libfs.writeFileSync(fileHash, data, 'utf8');
        }
        return false;
    },

    // exposing the builder class for better testing and customization
    // TODO: api doc
    BuilderClass: Builder

};