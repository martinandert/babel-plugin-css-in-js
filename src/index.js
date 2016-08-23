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
  context[KEY] = {
    cache: {},
    visiting: {},
  };

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

        context[KEY].visiting[filename] = true;
      },

      exit() {
        const filename = this.cssInJS.filename;

        /* istanbul ignore if */
        if (!context[KEY].visiting[filename]) return;

        const css = buildCSS(this.cssInJS.stylesheets, this.cssInJS.options);

        this.file.metadata.css = css;

        if (css && css.length) {
          context[KEY].cache[this.cssInJS.filename] = css;
        } else {
          delete context[KEY].cache[this.cssInJS.filename];
        }

        if (this.cssInJS.options.bundleFile && Object.keys(context[KEY].cache).length) {
          const bundleFile = join(process.cwd(), this.cssInJS.options.bundleFile);
          const output = [];

          mkDirPSync(dirname(bundleFile));

          foreach(context[KEY].cache, (fileCSS) => {
            output.push(fileCSS);
          });

          writeFileSync(bundleFile, output.join(''), { encoding: 'utf8' });
        }

        context[KEY].visiting[filename] = false;
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
        if (styleId.charAt(0) === '$') {
          return memo;
        }
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
