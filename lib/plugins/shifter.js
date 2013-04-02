var log = console,
    fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    existsSync = fs.existsSync || path.existsSync,
    shifterCLI = path.join(__dirname, '../../node_modules/shifter/bin/shifter'),
    contextForRunInContext = vm.createContext({
        require: require,
        module: require('module'),
        console: {
            log: function () {}
        },
        window: {},
        document: {}
    });

// todo: log should come from external
log.debug = log.info;

function checkYUIModule(file) {
    var mod,
        entry,
        source;

    contextForRunInContext.YUI = {
        add: function (name, fn, version, config) {
            if (mod) {
                log.debug('file `' + file + '` is a rollup.');
            } else {
                mod = {
                    name: name,
                    buildfile: file,
                    source: source,
                    builds: {}
                };
            }
            mod.builds[name] = {
                name: name,
                fn: fn,
                version: version,
                config: config || {}
            };
        }
    };
    try {
        source = fs.readFileSync(file, 'utf8');
        vm.runInContext(source, contextForRunInContext, file);
    } catch (e) {
        log.debug('skipping ' + file + ', it is not a YUI module.');
        return;
    }
    return mod;
}

module.exports = {

    describe: {
        summary: 'Shifter plugin for yui modules',
        extensions: ['js', 'json'],
        shifterBuildArgs: ['--no-coverage', '--no-lint', '--silent', '--quiet', '--no-global-config']
    },

    fileUpdated: function (meta, api) {

        var source_path = meta.fullPath,
            filename = path.basename(source_path),
            bundle = api.getBundle(meta.bundleName),
            args,
            js,
            mod;

        if (meta.ext === 'json' && filename !== 'build.json') {
            log.debug('Skipping json file that is not a shifter build ' + source_path);
            return;
        }

        if (!existsSync(shifterCLI)) {
            log.error('Shifter can be used in node dev mode only for performance reasons.');
            return;
        }

        mod = checkYUIModule(source_path);

        if (meta.ext !== 'json' && !mod) {
            log.warn('Invalid yui module ' + source_path, ', ignoring it');
            return;
        }

        args = [
            shifterCLI,
            "--build-dir", path.join(bundle.buildDirectory, 'yui-modules'),
            (meta.ext === '.js' ? '--yui-module' : '--config'), source_path
        ].concat(this.describe.shifterBuildArgs);

        return api.promise(function (fulfill, reject) {

            var spawn = require('win-spawn'),
                mkdirp = require('mkdirp');

            if (source_path.indexOf(bundle.baseDirectory) === 0) {
                try {
                    source_path = path.join(bundle.buildDirectory, 'yui-modules', mod.name, mod.name + '-debug.js');
                    log.info('copying js file `' + meta.fullPath + '` into ' + source_path);
                    mkdirp.sync(path.dirname(source_path));
                    fs.writeFileSync(source_path, mod.source, 'utf8');
                } catch (e) {
                    log.error('Error trying to copy `' + meta.fullPath + '` into `' + source_path + '`');
                    reject(e);
                    return;
                }
            }

            log.info('shifting ' + source_path);
            log.debug(args.join(' '));

            child = spawn(process.argv[0], args, {
                cwd: path.dirname(source_path),
                stdio: 'inherit'
            });
            child.on('exit', function (code) {
                log.debug('shifter finished with [' + source_path + ']');
                if (code) {
                    log.error('Error: exiting code ' + code + ' while executing: \n' +
                        args.join(' '));
                    reject(new Error(meta.fullPath + ": shifter compiler error: " + code));
                    return;
                }
                fulfill();
            });

        });

    }

};