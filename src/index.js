import assert from 'assert';
import extend from 'object-assign';
import foreach from 'foreach';
import { writeFileSync } from 'fs';
import { relative, join, dirname, resolve } from 'path';
import { sync as mkDirPSync } from 'mkdirp';

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
  bundleFile: 'bundle.css',
};

export default function plugin(context) {
  context[KEY] = {};

  return {
    visitor: visitor(context),
  };
}

function visitor(context) {
  const t = context.types;

  return {
    Program: {
      enter() {
        const filename = relative(process.cwd(), this.file.opts.filename);
        const options = buildOptions(this.opts, filename);

        this.cssInJS = { filename, options, stylesheets: {} };
      },

      exit() {
        /* istanbul ignore if */
        if (this.done) return;

        const css = buildCSS(this.cssInJS.stylesheets, this.cssInJS.options);

        context[KEY][this.cssInJS.filename] = this.file.metadata.css = css;

        let bundleCSS = '';

        foreach(context[KEY], (fileCSS) => {
          if (fileCSS.length) {
            bundleCSS += fileCSS;
          }
        });

        if (bundleCSS.length && this.cssInJS.options.bundleFile) {
          const bundleFile = join(process.cwd(), this.cssInJS.options.bundleFile);

          mkDirPSync(dirname(bundleFile));
          writeFileSync(bundleFile, bundleCSS, { encoding: 'utf8' });
        }

        this.done = true;
      },
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
      const expr = path.node.arguments[0];

      assert(expr, 'cssInJS(...) call is missing an argument');

      const obj = transformObjectExpressionIntoStyleSheetObject(expr, this.cssInJS.options.context);
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
    },
  };
}

const contextFileCache = {};

function buildOptions(options, filename) {
  options = extend({}, DEFAULT_OPTIONS, options, { filename });

  if (typeof options.context === 'string') {
    const file = resolve(options.context);

    if (typeof contextFileCache[file] === 'undefined') {
      contextFileCache[file] = require(file);
    }

    options.context = contextFileCache[file];
  }

  return options;
}
