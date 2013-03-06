YUI.add('app-modules-meta', function (Y, NAME) {
    Y.applyConfig({
        groups: {
            app: Y.merge((Y.config.groups && Y.config.groups.app) || {}, {
                modules: {}
            })
        }
    });
}, '', {requires: []});