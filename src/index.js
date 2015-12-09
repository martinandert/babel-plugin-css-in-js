import assert from 'assert';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import extend from 'object-assign';
import foreach from 'foreach';

import transformObjectExpressionIntoStyleSheetObject from './transformObjectExpressionIntoStyleSheetObject';
import transformStyleSheetObjectIntoSpecification from './transformStyleSheetObjectIntoSpecification';
import generateClassName from './generateClassName';
import buildCSS from './buildCSS';

const KEY = '__cssinjs';

const DEFAULT_OPTIONS = {
  identifier: 'cssInJS',
  vendorPrefixes: false,
  minify: false,
  compressClassNames: false,
  mediaMap: {},
  context: null,
  cacheDir: 'tmp/cache/',
  bundleFile: 'bundle.css'
};

export default function plugin(context) {
  context[KEY] = {};

  return {
    visitor: visitor(context)
  };
}

function visitor(context) {
  const t = context.types;

  return {
    Program: {
      enter() {
        const filename  = path.relative(process.cwd(), this.file.opts.filename);
        const options   = buildOptions(this.opts, filename);

        this.cssInJS = { filename, options, stylesheets: {} };
      },

      exit() {
        /* istanbul ignore if */
        if (this.done) return;

        const css = buildCSS(this.cssInJS.stylesheets, this.cssInJS.options);

        context[KEY][this.cssInJS.filename] = this.file.metadata.css = css;

        let bundleCSS = '';

        foreach(context[KEY], (css, filename) => {
          if (css.length) {
            bundleCSS += css;
          }
        });

        if (bundleCSS.length && this.cssInJS.options.bundleFile) {
          const bundleFile = path.join(process.cwd(), this.cssInJS.options.bundleFile);

          mkdirp.sync(path.dirname(bundleFile));
          fs.writeFileSync(bundleFile, bundleCSS, { encoding: 'utf8' });
        }

        this.done = true;
      }
    },

    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: this.cssInJS.options.identifier })) {
        return;
      }

      assert(
        t.isVariableDeclarator(path.parentPath.node),
        'return value of cssInJS(...) must be assigned to a variable'
      );

      const sheetId = path.parentPath.node.id.name;
      const expr    = path.node.arguments[0];

      assert(expr, 'cssInJS(...) call is missing an argument');

      const obj   = transformObjectExpressionIntoStyleSheetObject(expr, this.cssInJS.options.context);
      const sheet = transformStyleSheetObjectIntoSpecification(obj);

      this.cssInJS.stylesheets[sheetId] = sheet;

      const gcnOptions = extend({}, this.cssInJS.options, { prefixes: [this.cssInJS.filename, sheetId] });

      const properties = Object.keys(sheet).reduce((memo, styleId) => {
        return memo.concat(
          t.objectProperty(
            t.identifier(styleId),
            t.stringLiteral(generateClassName(styleId, gcnOptions))
          )
        );
      }, []);

      path.replaceWith(t.objectExpression(properties));
    }
  };
}

let contextFileCache = {};

function buildOptions(options, filename) {
  options = extend({}, DEFAULT_OPTIONS, options, { filename });

  if (typeof options.context === 'string') {
    const file = path.resolve(options.context);

    if (typeof contextFileCache[file] === 'undefined') {
      contextFileCache[file] = require(file);
    }

    options.context = contextFileCache[file];
  }

  return options;
}
