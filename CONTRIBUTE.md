## Contributing Code to `modown-yui`

- The main source files are located under `lib/`.
- Unit tests are located under `tests/units/*`.
- Examples are located under `examples/`.

To install the dependencies:

    npm install

    NOTE: `modown-yui` depends on `modown-static` module, which is still in
    development and is marked as `futureDependencies` in `package.json`.
    
    As a work around, run the following script after the `npm install` above.

    ./scripts/pretest.sh {{TAG}}

    where {{TAG}} is a valid `git tag` from `modown-static`. If {{TAG}} is
    omitted, it will default to `HEAD`.

To run the unit tests (with coverage by default):

    npm test

To generate the API docs under `build/apidocs/index.html`:

    ./scripts/gendocs.sh
