# Modown YUI Component

This compontent is responsible for exposing the
`yui_config` configuration at the app level using
`yui.config()` object, as well as per request
customization.

If the component is plug within `modown`, it will
automatically attach the `yui_config` configuration
into the runtime object produced by `modown-server`.

## Features

 * expose yui_config per request basis
 * expose seed files per request basis
 * provide basic configurations for cdn, debug, and other common conditions

## Other features

 * serve yui core modules from app origin
 * serve loader group with app modules from app origin

## Usage as stand alone middleware for express

```
TBD
```

## Usage as a modown plugin

```
TBD
```

## Dependencies

This npm package requires `modown-static` which is still in development and not
yet publixhed in NPM registry.

For now, dev will have to explicity install that dependency.

## TODO

 * Move lib/static.js into its own package and update the api

## How to contribute

See the [CONTRIBUTE.md](CONTRIBUTE.md) file for info.
