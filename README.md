# Modown YUI Component

This compontent is responsible for exposing the
`yui_config` configuration at the app level using
`yui.applyConfig()` object, as well as per request
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

## TODO

* Seed should rely on the groups to support combo when posible
* Move lib/static.js into its own package and update the api
* Support functions in the yui_config
* Proper computation of the core before adding more meta modules

## How to contribute

See the CONTRIBUTE.md file for info.
