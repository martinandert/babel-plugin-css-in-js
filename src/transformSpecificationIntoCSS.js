import foreach from 'foreach';
import buildCSSRule from './buildCSSRule';
import generateClassName from './generateClassName';

export default function transformSpecificationIntoCSS(spec, options = {}) {
  const css = [];

  foreach(spec, (value, key) => {
    processStyle(css, key, value, 0, null, options);
  });

  return css.join('\n');
}

function processStyle(css, name, spec, level, parent, options) {
  processRules(css, name, spec.rules, level, parent, options);
  processSelectors(css, name, spec.selectors, level, parent, options);
  processMediaQueries(css, name, spec.mediaQueries, level, parent, options);
  processParents(css, name, spec.parents, level, options);
}

function processRules(css, name, rules, level, parent, options) {
  if (isEmpty(rules)) { return; }

  let selector;

  if (name.charAt(0) === '$') {
    selector = name.substring(1);
  } else {
    selector = parent ? `${parent} ` : '';
    selector += '.' + generateClassName(name, options);
  }

  css.push(indent(level) + selector + ' {');

  foreach(rules, (value, key) => {
    css.push(indent(level + 1) + buildCSSRule(key, value));
  });

  css.push(indent(level) + '}');
}

function processSelectors(css, name, selectors, level, parent, options) {
  if (isEmpty(selectors)) { return; }

  foreach(selectors, (value, key) => {
    processRules(css, name + key, value.rules, level, parent, options);
  });
}

function processMediaQueries(css, name, mediaQueries, level, parent, options) {
  if (isEmpty(mediaQueries)) { return; }

  foreach(mediaQueries, (value, key) => {
    processMediaQuery(css, name, key, value, level, parent, options);
  });
}

function processParents(css, name, parents, level, options) {
  if (isEmpty(parents)) { return; }

  foreach(parents, (spec, key) => {
    processStyle(css, name, spec, level, key, options);
  });
}

function processMediaQuery(css, name, query, content, level, parent, options) {
  const mediaQueryCSS = [];

  processRules(mediaQueryCSS, name, content.rules, level + 1, parent, options);
  processSelectors(mediaQueryCSS, name, content.selectors, level + 1, parent, options);

  if (mediaQueryCSS.length) {
    css.push(indent(level) + '@' + generateMediaQueryName(query, options) + ' {');
    Array.prototype.push.apply(css, mediaQueryCSS);
    css.push(indent(level) + '}');
  }
}

function generateMediaQueryName(name, options) {
  if (options.mediaMap) {
    return options.mediaMap[name] || name;
  }

  return name;
}

function indent(level) {
  let result = '';

  for (let i = 0; i < level; i++) {
    result += '  ';
  }

  return result;
}

function isEmpty(obj) {
  return typeof obj !== 'object' || Object.keys(obj).length === 0;
}
