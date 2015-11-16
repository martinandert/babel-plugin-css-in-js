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
      enter(_, state) {
        const filename = path.relative(process.cwd(), state.file.opts.filename);

        state.opts = extend({}, DEFAULT_OPTIONS, state.opts, { filename, stylesheets: {} });
      },

      exit(_, state) {
        /* istanbul ignore if  */
        if (state.file.metadata.css) {
          return;
        }

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
      if (!t.isIdentifier(path.node.callee, { name: 'cssInJS' })) {
        return;
      }

      assert(
        t.isVariableDeclarator(path.parentPath.node),
        'return value of cssInJS(...) must be assigned to a variable'
      );

      const sheetId = path.parentPath.node.id.name;
      const expr    = path.node.arguments[0];

      assert(expr, 'cssInJS(...) call is missing an argument');

      const obj   = transformObjectExpressionIntoStyleSheetObject(expr, state.opts.context);
      const sheet = transformStyleSheetObjectIntoSpecification(obj);

      state.opts.stylesheets[sheetId] = sheet;

      const gcnOptions = extend({}, state.opts, { prefixes: [state.opts.filename, sheetId] });

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
