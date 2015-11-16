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
  vendorPrefixes: true,
  minify: false,
  compressClassNames: false,
  mediaMap: {},
  context: null,
  cacheDir: 'tmp/cache/babel-plugin-css-in-js/',
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
      enter(_, state) {
        const filename = path.relative(process.cwd(), state.file.opts.filename);

        state.opts = extend({}, DEFAULT_OPTIONS, state.opts, { filename, stylesheets: {} });
      },

      exit(_, state) {
        const css = buildCSS(state.opts.stylesheets, state.opts);

        context[KEY][state.opts.filename] = state.file.metadata.css = css;

        let bundleCSS = '';

        foreach(context[KEY], (css, filename) => {
          if (css.length) {
            bundleCSS += css;
          }
        });

        if (bundleCSS.length && state.opts.bundleFile) {
          const bundleFile = path.join(process.cwd(), state.opts.bundleFile);

          mkdirp.sync(path.dirname(bundleFile));
          fs.writeFileSync(bundleFile, bundleCSS, { encoding: 'utf8' });
        }
      }
    },

    CallExpression(path, state) {
      const node = path.node;

      if (!t.isIdentifier(node.callee, { name: 'cssInJS' })) {
        return;
      }

      const parent = path.parentPath.node;

      assert(
        t.isVariableDeclarator(parent),
        'return value of cssInJS(...) must be assigned to a variable'
      );

      const sheetId   = parent.id.name;
      const expr      = node.arguments[0];

      assert(expr, 'cssInJS(...) call is missing an argument');

      const obj   = transformObjectExpressionIntoStyleSheetObject(expr, state.opts.context);
      const sheet = transformStyleSheetObjectIntoSpecification(obj);

      state.opts.stylesheets[sheetId] = sheet;

      const gcnOptions = extend({}, state.opts, { prefixes: [state.opts.filename, sheetId] });

      let properties = [];

      Object.keys(sheet).forEach((styleId) => {
        const className = generateClassName(styleId, gcnOptions);
        const key       = t.identifier(styleId);
        const value     = t.stringLiteral(className);
        const property  = t.objectProperty(key, value);

        properties.push(property);
      });

      path.replaceWith(t.objectExpression(properties));
    }
  };
}
