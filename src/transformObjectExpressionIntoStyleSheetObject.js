import assert from 'assert';
import vm from 'vm';
import extend from 'object-assign';
import { types as t } from 'babel-core';
import generate from 'babel-generator';

const isBlank = /^\s*$/;

export default function transformObjectExpressionIntoStyleSheetObject(expr, context) {
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
