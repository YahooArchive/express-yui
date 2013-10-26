/*global YUI*/
YUI.add('loader-group2', function (Y, NAME) {
    "use strict";
    Y.applyConfig({
        groups: {
            group2: Y.merge((Y.config.groups && Y.config.groups.group2) || {}, {
                modules: {
                    "loader-group2": {
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
