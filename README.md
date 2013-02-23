# Modown YUI Component

This compontent is responsible for exposing the
`yui_config` configuration at the app level using
`yui.config()` object, as well as per request
customization.

If the component is plug within `modown`, it will
automatically attach the `yui_config` configuration
into the runtime object produced by `modown-server`.

## Usage as stand alone middleware for express

TBD

## Usage as a modown plugin

```
modown.plug(require('modown-yui'));
modown.yui({
    combine: false,
    debug: true,
    filter: "debug"
});
app.use(modown.yui.local());
```