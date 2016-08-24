# babel-plugin-css-in-js

[![build status](https://img.shields.io/travis/martinandert/babel-plugin-css-in-js.svg?style=flat-square)](https://travis-ci.org/martinandert/babel-plugin-css-in-js)
[![code climate](https://img.shields.io/codeclimate/github/martinandert/babel-plugin-css-in-js.svg?style=flat-square)](https://codeclimate.com/github/martinandert/babel-plugin-css-in-js)
[![test coverage](https://img.shields.io/codeclimate/coverage/github/martinandert/babel-plugin-css-in-js.svg?style=flat-square)](https://codeclimate.com/github/martinandert/babel-plugin-css-in-js)
[![npm version](https://img.shields.io/npm/v/babel-plugin-css-in-js.svg?style=flat-square)](https://www.npmjs.com/package/babel-plugin-css-in-js)

A plugin for Babel v6 which transforms inline styles defined in JavaScript modules into class names so they become available to, e.g. the `className` prop of React elements. While transforming, the plugin processes all JavaScript style definitions found and bundles them up into a CSS file, ready to be requested from your web server.

babel-plugin-css-in-js works seamlessly on both client and server. It has built-in support for media queries, pseudo-classes, and attribute selectors. The plugin's options allow you to configure vendor-prefixing, minification, and class name compression.

If you're impatient, [visit the live demo](http://babel-plugin-css-in-js.martinandert.com/). The source code for it can be found [in the example directory](example/).

## Example

In order for the plugin to work, in your components, surround each inline style specification with a module-level `cssInJS()` function call. This provides a hook for the plugin to process the first argument given to the call and then replace it with an object literal containing the resulting class names as values.

**In**

```jsx
<Button className={styles.button} />

var styles = cssInJS({
  button: {
    padding: 5,
    backgroundColor: "blue"
  }
});
```

**Out**

JavaScript:

```jsx
<Button className={styles.button} />

var styles = {
  button: "example_js_styles_button"
};
```

CSS:

```css
.example_js_styles_button {
  padding: 5px;
  background-color: blue;
}
```

The stylesheet specification format is explained [further down](#stylesheet-specification-format).

Note the return value of `cssInJS(...)` must be assigned to a variable. The name of the variable is used to distinguish multiple `cssInJS` calls within a file.

## Installation

Install via npm:

```sh
$ npm install babel-plugin-css-in-js --save-dev
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["css-in-js"]
}
```

### Via CLI

```sh
$ babel  --plugins css-in-js  script.js
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  plugins: ['css-in-js']
});
```

## Options

The plugin allows configuration of several parameters which control the generated CSS. You can pass options to the plugin by using a two-element array when adding the plugin. For instance, using `.babelrc`:

```json
{
  "presets": [
    "es2015",
    "react"
  ],
  "plugins": [
    "foo-plugin",
    ["css-in-js", { "vendorPrefixes": true, "bundleFile": "public/bundle.css" }]
  ]
}
```

**Available options:**

| Option               | Default       | Description                                                                                                                                                                                                                                                                                                                               |
|----------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `vendorPrefixes`     | `false`       | If true, the generated CSS is run through [autoprefixer](https://www.npmjs.com/package/autoprefixer) to add vendor prefixes to the rules. If set to an object, it is passed to autoprefixer as `options` argument.                                                                                                                        |
| `minify`             | `false`       | Set to `true` to enable minification of the generated CSS. The popular [clean-css](https://www.npmjs.com/package/clean-css) package is used for this.                                                                                                                                                                                     |
| `compressClassNames` | `false`       | Set to `true` to shorten/obfuscate generated CSS class names. A class name like `"my_file-my_styles_var-my_name"` will so be converted to, e.g., `"_bf"`.                                                                                                                                                                                 |
| `mediaMap`           | `{}`          | This allows you to define media query shortcuts which are expanded on building the CSS. Example: using `{ phone: "media only screen and (max-width: 640px)" }` as value for this option and a stylesheet spec having `"@phone"` as a key, that key will be translated to `@media only screen and (max-width: 640px)` in the final CSS.    |
| `context`            | `null`        | If set to an object, each identifier found on the right-hand side of a style rule is substituted with the corresponding property value of this object. If set to a file path, the file is require'd and the exported object is used as stylesheet context.                                                                                |
| `cacheDir`           | `tmp/cache/`  | If you set the `compressClassNames` option to `true`, the class name cache will be persisted in a file in this directory.                                                                                                                                                                                                                 |
| `bundleFile`         | `bundle.css`  | All generated CSS is bundled into this file.                                                                                                                                                                                                                                                                                              |
| `identifier`         | `cssInJS`     | The name used for detecting inline styles to transform.                                                                                                                                                                                                                                                                                   |


## Stylesheet Specification Format

Here's what you can put inside the parentheses of `cssInJS(...)`.

**Simple Styles**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block'
  },

  myInput: {
    width: '100%',
    // ... etc.
  }
}
```

An inline style is not specified as a string. Instead it is specified with an object whose properties form the CSS ruleset for that style. A property's key is the camelCased version of the rule name, and the value is the rule's value, usually a string.

There's also a shorthand notation for specifying pixel values, see [this React tip](http://facebook.github.io/react/tips/style-props-value-px.html) for more details.

**Pseudo-Classes and Attribute Selectors**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block',
    cursor: 'pointer',

    ':focus': {
      borderColor: '#aaa'
    },

    ':hover': {
      borderColor: '#ddd',

      ':active': {
        borderColor: '#eee'
      }
    },

    '[disabled]': {
      cursor: 'not-allowed',
      opacity: .5,

      ':hover': {
        backgroundColor: 'transparent'
      }
    }
  }
}
```

As you can see, pseudo-classes and attribute selectors can be nested arbitrarily deep. But you don't have to use nesting. Here is the example from above in the un-nested version:

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block',
    cursor: 'pointer'
  },
  'myButton:focus': {
    borderColor: '#aaa'
  },
  'myButton:hover': {
    borderColor: '#ddd'
  },
  'myButton:hover:active': {
    borderColor: '#eee'
  },
  'myButton[disabled]': {
    cursor: 'not-allowed',
    opacity: .5
  },
  'myButton[disabled]:hover': {
    backgroundColor: 'transparent'
  }
}
```

**Media Queries**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    // ...
  },

  myInput: {
    width: '100%',
    // ...
  },

  '@media only screen and (max-width: 480px)': {
    myButton: {
      borderWidth: 0
    },

    myInput: {
      fontSize: 14
    }
  },

  '@media only screen and (max-width: 768px)': {
    myButton: {
      borderWidth: 2,

      ':hover': {
        borderWidth: 3
      }
    }
  }
}
```

Media queries can appear at the top-level (as shown above) or nested in the style:

```js
{
  myButton: {
    border: 'solid 1px #ccc',

    '@media only screen and (max-width: 480px)': {
      borderWidth: 0,

      ':active': {
        borderColor: 'blue'
      }
    },

    '@media only screen and (max-width: 768px)': {
      // ...
    }
  }
}
```

Given you set `{ phone: 'media only screen and (max-width: 480px)', tablet: 'media only screen and (max-width: 768px)' }` as `mediaMap` option for the transformation, the above spec can be simplified to:

```js
{
  myButton: {
    border: 'solid 1px #ccc',

    '@phone': {
      borderWidth: 0,

      ':active': {
        borderColor: 'blue'
      }
    },

    '@tablet': {
      // ...
    }
  }
}
```

**Expressions in Style Rules**

You can do simple arithmetic and string concats on the right-hand side of style rules. Each identifier found is substituted with the corresponding property value of the `context` object provided as option.

Example for a given context `{ MyColors: { green: '#00FF00' }, myUrl: 'path/to/image.png' }`:

```js
{
  myButton: {
    color: MyColors.green,
    borderWidth: 42 + 'px',
    backgroundImage: 'url(' + myUrl + ')'
  }
}
```

## Dynamic Style using Function Expression

In order to write style rules dynamically, you can use Function Expression. FunctionExpression gives more freedom than ObjectExpression. It receives `context` object as first parameter, with this, you can do any programmatic operation, such as the condition statement or the iteration statement even. `es6` syntax is also available. One thing to keep in mind is that the bundle file extraction and js file transformation are conducted by style rule be returned from FunctionExpression.

When you want to show different styles based on whether user environment is android or ios in order to support cross platform, when you want to support various themes like dark, light theme. or when you want to see different styles according to production, development environement, you can use as below:

```js
const style = cssInJS( (context)=>{

  const { __IOS__, __ANDROID__, __ENV__, theme } = context;

  const buttonSize = 100;
  let marginList = [10,8,10,8];

  if( __IOS__ ) {
    marginList = marginList.map( v=> v - 2 );
  }

  return {
    button: {
      width: buttonSize,
      margin: marginList.map( v=>v+'px' ).join(' '),
      color: __ANDROID__ ? 'red' : 'blue',
      border: __ENV__ === 'development' ? '2px solid red' : 'none'
    },

    buttonBox: {
      backgroundColor: theme === 'dark' ? 'black' : 'white';
    }
  };
});
```

`context` in the above code, can be passed from babel loader setting like this:

```js
// webpack.config.js

const env = process.env.NODE_ENV;       // this build env can be set dynamically
const platform = process.env.PLATFORM;  // this build env can be set dynamically
const theme = 'dark';                   // this build env can be set dynamically

// to dynamic setting, it is recommended to do set in js file instaed of .babelrc
const babelPluginCSSInJS = [   
  ["css-in-js", {
    compressClassNames: env === 'production',
    vendorPrefixes: true,

    // You can get `css bundle` files for each platform or theme
    bundleFile: `build/bundle.${theme}.${platform}.css`,

    context: {
      __IOS__: platform === 'ios',          // it can be set dynamically
      __ANDROID__: platform === 'android',  // it can be set dynamically
      __ENV__: env,                         // it can be set dynamically
      theme: theme,                         // it can be set dynamically
    },

    // or you can load from other file
    // context: require('./cssInJSContext.js'),
  }],
];

module.exports = {
  ...

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      __ENV__: env,
      __IOS__: platform === 'ios',
      __ANDROID__: platform === 'android',
    }),
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ["es2015","stage-0","react"],
        plugins: [
          "transform-decorators-legacy",
          "react-hot-loader/babel",
          babelPluginCSSInJS,
        ]
      },
    }],
  },

  ...
}
```

Note: It should only be a function able to perform in a completely blocked nodejs [VM](https://nodejs.org/api/vm.html) sandbox environment, reveiving only the context object. Therefore you cannot use other module using require, import within FunctionExpression. Also you cannot access any references outside FunctionExpression.

Here are another example, carefully review the `Wrong!` comments:
```js
const buttonNum = 3;

const style = cssInJS( (context)=>{ // ------ start of the FunctionExpression scope

  const defaultColor = context.defaultColor;   // OK. You can access context's all values
  const { buttonWidth } = context;     // OK. You can use es6 syntax
  const _ = require('underscore');     // Wrong! You cannot load other module using require, import

  const aWidth = 80;                   // OK
  const bWidth = 100;                  // OK
  const aHeight = 40;                  // OK
  const bHeight = 50;                  // OK

  function max(a, b) {                 // OK. You can have inner function even
    return a > b ? a : b;
  }

  const min = context.min;             // OK. function can be passed from context
                                       // Note! But now function can't be passed from '.babelrc' setting file
                                       // Use webpack loader setting

  return {
    buttonBox: {
      width: buttonNum * buttonWidth,  // Wrong! 'buttonNum' reference is outside FunctionExpression scope
      height: buttonWidth * 1.5,       // OK
      backgroundColor: defaultColor,   // OK
    },
    abutton: {
      width: aWidth,                   // OK. 'aWidth' reference is inside FunctionExpression scope
      width: aHeight,                  // OK
      backgroundColor: defaultColor,   // OK
    },
    bbutton: {
      width: bWidth,                   // OK. 'bWidth' reference is inside FunctionExpression scope
      width: bHeight,                  // OK
      backgroundColor: defaultColor,   // OK
    },
    cbutton: {
      backgroundColor: defaultColor,   // OK

      width: max( aWidth, bWidth ),    // OK. 'max' is inside FunctionExpression scope
      height: min( aHeight, bHeight ), // OK. 'min' is inside FunctionExpression scope
      // As long as reference is inside FunctionExpression scope, you can use any references you want
    },
  };
});   // ------------------------------------ end of the FunctionExpression scope!
```

In the above `Wrong!` case, you will encounter `When use the FunctionExpression for cssInJS, all references must be in the function scope` error.



## Example

If you just want to see some example output for a file, head over to [this repo's quick example](example/quick/). There you will find the code for a simple button component together with its transformed version and CSS file (both with and without compressed class names).

The code for a more sophisticated example can be found [in the repo's example directory](example/). After cloning this repo, see the example's README for more info on how to run it.


## Caveats

* Just using `var styles = cssInJS(...)` in your React modules and skipping the transformation step won't work. It's the transformation that is responsible for a) generating the real CSS, and b) turning your `cssInJS(...)` calls into object literals holding the CSS class names so you can do `<foo className={styles.bar} />` without breaking React. But you are transpiling your JavaScript anyway to get these cool new ES2015 features, aren't you?
* Apart from simple arithmetic and string concats, a stylesheet specification cannot contain advanced dynamic stuff, because although the transformer parses the source input, it is not compiled. If you really need to add truly dynamic styles, that's what the `style` attribute/prop was made for. `style` also has the positive side-effect of taking precedence over class names.


## Contributing

1. Fork it ( https://github.com/martinandert/babel-plugin-css-in-js )
2. Run `npm install` to install dependencies.
3. Run the tests. We only take pull requests with passing tests, and it's great to know that you have a clean slate: `make test`.
4. Create your feature branch (`git checkout -b my-new-feature`)
5. Add a test for your change. Only refactoring and documentation changes require no new tests. If you are adding functionality or are fixing a bug, we need a test!
6. Make the test pass.
7. Commit your changes (`git commit -am 'add some feature'`)
8. Push to your fork (`git push origin my-new-feature`)
9. Create a new Pull Request


## License

Released under The MIT License.
