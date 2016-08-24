import assert from 'assert';
import { types as t } from 'babel-core';

import transformObjectExpressionIntoStyleSheetObject from './transformObjectExpressionIntoStyleSheetObject';
import transformFunctionExpressionIntoStyleSheetObject from './transformFunctionExpressionIntoStyleSheetObject';

export default function transformIntoStyleSheetObject(expr, context, transformOptions) {
  if (t.isFunctionExpression(expr) || t.isArrowFunctionExpression(expr)) {
    return transformFunctionExpressionIntoStyleSheetObject(expr, context, transformOptions);
  } else if (t.isObjectExpression(expr)) {
    return transformObjectExpressionIntoStyleSheetObject(expr, context);
  }

  assert(false, 'must be an object expression or a function expression');
}
