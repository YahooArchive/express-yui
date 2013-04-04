YUI.add('group2', function (Y, NAME) {
    Y.applyConfig({
        groups: {
            group2: Y.merge((Y.config.groups && Y.config.groups.group2) || {}, {
                modules: {
                    "group2": {
                        group: "group2"
                    },
                    "bar": {
                        group: "group2",
                        type: "css"
                    }
                }
            })
        }
    });
}, '@VERSION@');
