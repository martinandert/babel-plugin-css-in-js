import foreach from 'foreach';
import buildCSSRule from './buildCSSRule';
import generateClassName from './generateClassName';

export default function transformSpecificationIntoCSS(spec, options = {}) {
  const css = [];

  foreach(spec, (value, key) => {
    processStyle(css, key, value, 0, options);
  });

  return css.join('\n');
}

function processStyle(css, name, spec, level, options) {
  processRules(css, name, spec.rules, level, options);
  processSelectors(css, name, spec.selectors, level, options);
  processMediaQueries(css, name, spec.mediaQueries, level, options);
}

function processRules(css, name, rules, level, options) {
  if (isEmpty(rules)) { return; }

  const selector = name.charAt(0) === '$' ? name.substring(1) : ('.' + generateClassName(name, options));
  css.push(indent(level) + selector + ' {');

  foreach(rules, (value, key) => {
    css.push(indent(level + 1) + buildCSSRule(key, value));
  });

  css.push(indent(level) + '}');
}

function processSelectors(css, name, selectors, level, options) {
  if (isEmpty(selectors)) { return; }

  foreach(selectors, (value, key) => {
    processRules(css, name + key, value.rules, level, options);
  });
}

function processMediaQueries(css, name, mediaQueries, level, options) {
  if (isEmpty(mediaQueries)) { return; }

  foreach(mediaQueries, (value, key) => {
    processMediaQuery(css, name, key, value, level, options);
  });
}

function processMediaQuery(css, name, query, content, level, options) {
  const mediaQueryCSS = [];

  processRules(mediaQueryCSS, name, content.rules, level + 1, options);
  processSelectors(mediaQueryCSS, name, content.selectors, level + 1, options);

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
