import assert from 'assert';
import os from 'os';
import { transform } from 'babel-core';
import plugin from '../src/';
import { clearCache } from '../src/compressClassName';

describe('babel-plugin-css-in-js', () => {
  function makeOptions(options = {}) {
    return Object.assign({
      plugins: [
        [plugin, Object.assign({ bundleFile: 'tmp/bundle.css' }, options)]
      ],
      filename: 'test'
    }, options.babel);
  }

  function squish(str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s+/g, ' ');
  }

  function testTransformed(spec) {
    const options = makeOptions(spec.options);
    const result  = transform(spec.from, options);
    const actual  = squish(result.code);
    let expected  = squish(spec.to);

    if (options.filename) {
      expected = '"use strict"; ' + expected;
    }

    assert.equal(actual, expected);

    return result.metadata.css;
  }

  function testStyleRule(css, className, rule) {
    assert(css);

    const hasClassNameWithRule = new RegExp(`\\.${className}\\s*\\{[^\\}]*?${rule}`);

    assert(hasClassNameWithRule.test(css));
  }

  it('does nothing if no "cssInJS" call is present', () => {
    let code = 'var styles = foo({ foo: { margin: 0 } });';

    const css = testTransformed({ from: code, to: code });

    assert.strictEqual(css, '');
  });

  it('throws if return value of "cssInJS" call is not assigned to a variable', () => {
    assert.throws(() => {
      testTransformed({
        from: `
          cssInJS({ foo: { margin: 0 } });
        `
      });
    }, /must be assigned to a variable/);
  });

  it('returns empty css if empty stylesheet provided', () => {
    const css = testTransformed({
      from: 'var styles = cssInJS({});',
      to:   'var styles = {};'
    });

    assert.strictEqual(css, '');
  });

  it('works without a babel filename option', () => {
    const css = testTransformed({
      from: 'var styles = cssInJS({ foo: { marginTop: -10, content: "foo" } });',
      to:   'var styles = { foo: "unknown-styles-foo" };',
      options: { babel: { filename: undefined } }
    });

    assert(css.indexOf('.unknown-styles-foo') > -1);
  });

  describe('with compressClassNames option set to true', () => {
    beforeEach(() => {
      clearCache({});
      clearCache({ cacheDir: os.tmpdir() });
    });

    it('compresses class names with memory cache', () => {
      const css = testTransformed({
        from: `
          var styles1 = cssInJS({ foo: { margin: 0 }, bar: { padding: 0 } });
          var styles2 = cssInJS({ xyz: { padding: 10 } });
        `,
        to: `
          var styles1 = { foo: "_0", bar: "_1" };
          var styles2 = { xyz: "_2" };
        `,
        options: {
          compressClassNames: true,
          cacheDir: null
        }
      });

      testStyleRule(css, '_0', 'margin: 0');
      testStyleRule(css, '_1', 'padding: 0');
      testStyleRule(css, '_2', 'padding: 10');
    });

    it('compresses class names with disk cache', () => {
      const css = testTransformed({
        from: `
          var styles1 = cssInJS({ foo: { margin: 0 }, bar: { padding: 0 } });
          var styles2 = cssInJS({ xyz: { padding: 10 } });
        `,
        to: `
          var styles1 = { foo: "_0", bar: "_1" };
          var styles2 = { xyz: "_2" };
        `,
        options: {
          compressClassNames: true,
          cacheDir: os.tmpdir()
        }
      });

      testStyleRule(css, '_0', 'margin: 0');
      testStyleRule(css, '_1', 'padding: 0');
      testStyleRule(css, '_2', 'padding: 10');
    });

    it('memoizes compressed class names between runs', () => {
      const css1 = testTransformed({
        from: `var styles = cssInJS({ foo: { margin: 0 } });`,
        to:   `var styles = { foo: "_0" };`,
        options: {
          compressClassNames: true,
          cacheDir: null,
          babel: { filename: 'foo.js' }
        }
      });

      testStyleRule(css1, '_0', 'margin: 0');

      const css2 = testTransformed({
        from: `var styles = cssInJS({ foo: { margin: 0 } });`,
        to:   `var styles = { foo: "_0" };`,
        options: {
          compressClassNames: true,
          cacheDir: null,
          babel: { filename: 'foo.js' }
        }
      });

      testStyleRule(css2, '_0', 'margin: 0');
    });
  });

  describe('with vendorPrefixes option set to true', () => {
    it('adds vendor prefixes', () => {
      const css = testTransformed({
        from: 'var styles = cssInJS({ foo: { flex: 1 } });',
        to:   'var styles = { foo: "test-styles-foo" };',
        options: { vendorPrefixes: true }
      });

      testStyleRule(css, 'test-styles-foo', 'flex: 1');
      testStyleRule(css, 'test-styles-foo', '-webkit-flex: 1');
      testStyleRule(css, 'test-styles-foo', '-ms-flex: 1');
    });
  });

  describe('with vendorPrefixes option set to an object', () => {
    it('adds vendor prefixes', () => {
      const css = testTransformed({
        from: 'var styles = cssInJS({ foo: { flex: 1 } });',
        to:   'var styles = { foo: "test-styles-foo" };',
        options: { vendorPrefixes: { remove: false } }
      });

      testStyleRule(css, 'test-styles-foo', 'flex: 1');
      testStyleRule(css, 'test-styles-foo', '-webkit-flex: 1');
      testStyleRule(css, 'test-styles-foo', '-ms-flex: 1');
    });
  });

  describe('with minify option set to true', () => {
    it('minifies css', () => {
      const css = testTransformed({
        from: 'var styles = cssInJS({ foo: { margin: 0 }, bar: { padding: 0 } });',
        to:   'var styles = { foo: "test-styles-foo", bar: "test-styles-bar" };',
        options: { minify: true }
      });

      assert.equal(css, '.test-styles-foo{margin:0}.test-styles-bar{padding:0}');
    });
  });

  describe('with babel filename option provided', () => {
    it('respects filename when generating class names', () => {
      const css = testTransformed({
        from: 'var styles = cssInJS({ foo: { margin: 0 } });',
        to:   'var styles = { foo: "x_y_js-styles-foo" };',
        options: { babel: { filename: 'x/y.js' } }
      });

      testStyleRule(css, 'x_y_js-styles-foo', 'margin: 0');
    });
  });

  describe('with context option', () => {
    describe('being a plain object', () => {
      const context = {
        forty: {
          two: 42
        }
      };

      it('respects context when generating css', () => {
        const css = testTransformed({
          from: 'var styles = cssInJS({ foo: { margin: forty.two + "pt" } });',
          to:   'var styles = { foo: "test-styles-foo" };',
          options: { context }
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 42pt');
      });
    });

    describe('being a file path', () => {
      const context = "test/fixtures/context";

      it('uses the modules default export as value', () => {
        const css = testTransformed({
          from: 'var styles = cssInJS({ foo: { margin: forty.two + "pt" } });',
          to:   'var styles = { foo: "test-styles-foo" };',
          options: { context }
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 42pt');
      });
    });
  });

  describe('with identifier option provided', () => {
    it('uses that identifier to detect stylesheets to transform', () => {
      const css = testTransformed({
        from: 'var styles = __OMG__({ foo: { margin: 0 } });',
        to:   'var styles = { foo: "test-styles-foo" };',
        options: { identifier: '__OMG__' }
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });
  });
});
