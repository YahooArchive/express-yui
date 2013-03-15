YUI.add('foo', function (Y, NAME) {
    Y[NAME] = true;
}, '', {requires: ["node-base", "json-stringify"]});