# babel-plugin-css-in-js Example Project

This example utilizes babel-plugin-css-in-js to process and bundle CSS defined in JS. See `Makefile` and `.babelrc` for details.

To run it in development environment, execute

```bash
$ make run
```

To run it in production environment (which compresses and minifies CSS and class names), execute

```bash
$ make run-production
```

After that, point your web browser to `http://localhost:3000`.

Use your browser's "Inspect Element" tool to see how all styles were turned into class names.
