YUI.add('binder-index', function(Y) {
    console.warn('if you see this in the server side console, then something is really wrong here!');
    Y.one('body').append('<p>binder is in place!</p>');
}, '', {
    requires: ['node'],
    affinity: 'client'
});
