import assert from 'assert';
import vm from 'vm';
import { types as t, transform } from 'babel-core';
import generate from 'babel-generator';

const useStrict = /['"]use strict['"];?(\r?\n)*/g;

export default function transformFunctionExpressionIntoStyleSheetObject(expr, context, transformOptions) {
  assert(
    t.isFunctionExpression(expr) || t.isArrowFunctionExpression(expr),
    'must be a function expression'
  );

  const code = transform(`
    const fn = ${generate(expr).code};
    result = fn(context) || {};
  `, transformOptions).code.replace(useStrict, '');

  const sandbox = { result: null, context };
  const vmContext = vm.createContext(sandbox);
  const script = new vm.Script(code);

  try {
    script.runInContext(vmContext, sandbox);
  } catch (err) {
    if (err.name === 'ReferenceError') {
      assert(false, err + '\nWhen providing a function to cssInJS, all references must be in the function\'s scope.');
    } else {
      assert(false, err.toString());
    }
  }

  return sandbox.result;
}
