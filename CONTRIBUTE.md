## Contributing Code to `express-yui`

This components follows the same contribution model used by [mojito][].

Please be sure to sign our [CLA][] before you submit pull requests or otherwise contribute to `express-yui`. This protects `express-yui` developers, who rely on [`express-yui`'s BSD license][].

[`express-yui`'s BSD license]: https://github.com/yahoo/express-yui/blob/master/LICENSE.md
[CLA]: http://developer.yahoo.com/cocktails/mojito/cla/
[Contributing-Code-to-Mojito file]: https://github.com/yahoo/express-yui/blob/master/CONTRIBUTE.md

## Dev mode installation

- The main source files are located under `lib/`.
- Unit tests are located under `tests/units/*`.
- Examples are located under `examples/`.

To install the dependencies:

    npm install

To run the unit tests (with coverage by default):

    npm test

To generate the API docs under `build/apidocs/index.html`:

    rm -rf ./build/apidocs && mkdir -p ./build/apidocs
    npm run docs

To lint the app lib folder:

    npm run lint