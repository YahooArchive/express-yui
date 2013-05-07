/*global YUI*/
YUI.add('foo', function (Y, NAME) {
    "use strict";
    Y[NAME] = true;
}, '@VERSION@', {"requires": ["node-base", "json-stringify"]});
