module.exports = {

    seed: function (modules) {

        var config = this.config({
            seed: modules
        });

        return false;

    },

    exposeSeed: function () {

        // getting static config
        var config = this.config(),
            seedCache,
            modules = [].concat(config.seed || ['yui-base']),
            mod,
            i;

        // TODO: expand modules
        for (mod in modules) {
            if (modules.hasOwnProperty(mod)) {
                // TBD
            }
        }

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