import assert from 'assert';
import vm from 'vm';
import extend from 'object-assign';
import { types as t, transform } from 'babel-core';
import generate from 'babel-generator';

// preloading to fast test
require('babel-preset-es2015-without-strict');

const isBlank = /^\s*$/;

export default function transformIntoStyleSheetObject(expr, context, code) {
  if (t.isFunctionExpression(expr) || t.isArrowFunctionExpression(expr)) {
    return transformFunctionExpressionIntoStyleSheetObject(expr, context, code);
  } else if (t.isObjectExpression(expr)) {
    return transformObjectExpressionIntoStyleSheetObject(expr, context);
  }

  assert(false, 'must be a object expression or function expression');
}

export function transformFunctionExpressionIntoStyleSheetObject(expr, context, code) {
  assert(
    t.isFunctionExpression(expr) || t.isArrowFunctionExpression(expr),
    'must be a function expression'
  );

	// TODO: need file encoding test
  const startLine = expr.loc.start.line - 1;
  const endLine = expr.loc.end.line - 1;
  const startColumn = expr.loc.start.column;
  const endColumn = expr.loc.end.column;

  let codeLineList = code.split('\n');
  codeLineList = codeLineList.splice(startLine, endLine - startLine + 1);
  const lastIdx = codeLineList.length - 1;
  codeLineList[lastIdx] = codeLineList[lastIdx].substr(0, endColumn);
  codeLineList[0] = codeLineList[0].substr(startColumn);
  let es6Code = codeLineList.join('\n');
  // es6Code = 'var cssInJS = ' + es6Code;
  es6Code = 'result = (' + es6Code + ')( injectedContext )';

  // console.log( es6Code );	//eslint-disable-line
  // console.log( '-------------------' );	//eslint-disable-line

  // It ensure to works even es6 code well
  const itWillRun = transform(es6Code, { presets: ['es2015-without-strict'] });
  // console.log( itWillRun.code );	//eslint-disable-line
  // console.log( '');	//eslint-disable-line
  // console.log( '');	//eslint-disable-line

  // codeWillRun = 'var func = ' + codeWillRun;
  // codeWillRun += '\nresult = func( injectedContext )';

  // errors will get ErrorConstructors like
  // EvalError, InternalError, RangeError, ReferenceError,
  // SyntaxError, TypeError, URIError
  const sandbox = { result: null, injectedContext: context, errors: {} };

  const vmContext = new vm.createContext(sandbox);
  const script = new vm.Script(itWillRun.code);

  try {
    script.runInContext(vmContext, sandbox);
  } catch (err) {
    if (sandbox.errors.ReferenceError === err.constructor) {
      assert(false, 'When use Function Expression to cssInJS, all references must be in the function scope');
    } else {
      assert(false, err + '\nUnkown error, check babel-plugin-css-in-js guide');
    }
  }

  return sandbox.result;
}

export function transformObjectExpressionIntoStyleSheetObject(expr, context) {
  assert(t.isObjectExpression(expr), 'must be a object expression');

  context = vm.createContext(extend({}, context));

  context.evaluate = function evaluate(node) {
    return vm.runInContext(generate(node).code, this);
  };

  const result = {};

  expr.properties.forEach((property) => {
    processTopLevelProperty(property.key, property.value, result, context);
  });

  return result;
}

function processTopLevelProperty(key, value, result, context) {
  const name = keyToName(key);

  assert(t.isObjectExpression(value), 'top-level value must be a object expression');

  result[name] = {};

  processProperties(value.properties, result[name], context);
}

function processProperties(properties, result, context) {
  properties.forEach((property) => {
    processProperty(property.key, property.value, result, context);
  });
}

function processProperty(key, value, result, context) {
  const name = keyToName(key);

  if (canEvaluate(value, context)) {
    const val = context.evaluate(value);

    assert(typeof val === 'string' || typeof val === 'number', 'value must be a string or number');

    if (name !== 'content' && typeof val === 'string') {
      assert(!isBlank.test(val), 'string value cannot be blank');
    }

    result[name] = val;
  } else if (t.isObjectExpression(value)) {
    result[name] = {};

    processProperties(value.properties, result[name], context);
  } else if (t.isUnaryExpression(value) && value.prefix === true && value.operator === '-') {
    assert(t.isLiteral(value.argument), 'invalid unary argument type');

    result[name] = -value.argument.value;
  } else {
    assert(false, 'invalid value expression type');
  }
}

function keyToName(key) {
  assert(t.isIdentifier(key) || t.isLiteral(key) && typeof key.value === 'string', 'key must be a string or identifier');

  return key.name || key.value;
}

function canEvaluate(expr, context) {
  if (t.isLiteral(expr)) {
    return true;
  } else if (t.isIdentifier(expr) && context.hasOwnProperty(expr.name)) {
    return true;
  } else if (t.isMemberExpression(expr)) {
    return t.isIdentifier(expr.property) && canEvaluate(expr.object, context);
  } else if (t.isBinaryExpression(expr)) {
    return canEvaluate(expr.left, context) && canEvaluate(expr.right, context);
  }

  return false;
}
