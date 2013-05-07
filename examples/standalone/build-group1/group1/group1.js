
/*global YUI*/
YUI.add('group1', function (Y, NAME) {
    "use strict";
    Y.applyConfig({
        groups: {
            group1: Y.merge((Y.config.groups && Y.config.groups.group1) || {}, {
                modules: {
                    "foo": {
                        group: "group1",
                        requires: ["node-base", "json-stringify"]
                    },
                    "group1": {
                        group: "group1"
                    }
                }
            })
        }
    });
}, '@VERSION@');
