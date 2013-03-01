# Modown YUI Component

This compontent is responsible for exposing the
`yui_config` configuration at the app level using
`yui.config()` object, as well as per request
customization.

If the component is plug within `modown`, it will
automatically attach the `yui_config` configuration
into the runtime object produced by `modown-server`.

## Goals

 * expose yui_config per request basis
 * expose seed files per request basis
 * serve yui core modules when needed from app origin
 * serve app yui modules when needed from app origin
 * provide basic configurations for cdn, debug, and other common conditions
 * facilitate development by building synthetic modules with loader meta data
 * provide build capabilities to compile synthetic files upfront for production

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

## How to contribute

See the CONTRIBUTE.md file for info.
