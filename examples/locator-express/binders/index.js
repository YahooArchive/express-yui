/*jslint */
/*global YUI, console*/
YUI.add('binder-index', function (Y) {

    "use strict";

    Y.Binders = {
        index: {
            update: function (node, data) {
                var fooContent = Y.Template.get('demo/foo')(data);
                node.setContent(fooContent);
            }
        }
    };

}, '', {
    requires: ['node', 'template-base', 'demo-template-foo'],
    affinity: 'client'
});
