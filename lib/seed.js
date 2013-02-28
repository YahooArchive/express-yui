/*jslint node:true*/

module.exports = {

    /**
     * Specify a list of modules to use as seed.
     *
     * E.g. seed(['yui-base', 'loader-base'];
     *
     * @param {Array} modules list of modules to use
     */
    seed: function (modules) {

        var config = this.config({
            seed: modules
        });

        return false;

    },

    /**
     * Expand the list of seed modules and expose the seeds to the client.
     */
    exposeSeed: function () {

        // getting static config
        var config = this.config(),
            seedCache = '',
            modules = [].concat(config.seed || ['yui-base']),
            appModules = [].concat((config.groups && config.groups.app && config.groups.app.modules) || []),
            mod,
            i,
            Y,
            loader;

        Y = this.YUI({sync: true}).use(['loader-base'].concat(appModules));

        // TODO: add config so that module expansion can be disabled if needed
        // expand modules
        loader = new Y.Loader({
            base: config.base,
            ignoreRegistered: true,
            require : modules
        });
        loader.calculate();
        modules = [].concat(loader.sorted);
        loader = null;
        Y = null;

        // producing blob with the html fragment
        for (i = 0; i < modules.length; i += 1) {
            seedCache += '<script src="' +
                config.base + modules[i] + '/' + modules[i] +
                (config.filter === 'debug' ? '-debug' : '-min') +
                '.js' + '"></script>';
        }

        return seedCache ? function (req, res, next) {

            // TODO: maybe using lang to replace a token

            // if express-expose is available, we surface some entries
            if (res.expose) {
                res.expose(seedCache, 'yui_seed');
            }

            next();

        } : false;

    }

};
