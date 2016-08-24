import assert from 'assert';
import { parse } from 'babylon';
import transform from '../src/transformFunctionExpressionIntoStyleSheetObject';

describe('transformFunctionExpressionIntoStyleSheetObject', () => {
  function makeExpression(source) {
    return parse('var _ = ' + source).program.body[0].declarations[0].init;
  }

  function testValidInput(input, expected, context) {
    const expr = makeExpression(input);

    assert.deepEqual(transform(expr, context, { presets: ['es2015'] }), expected);
  }

  function testInvalidInput(input, message) {
    const expr = makeExpression(input);

    assert.throws(() => {
      transform(expr, null, { presets: ['es2015'] });
    }, message || assert.AssertionError);
  }

  it('transforms valid input properly', () => {
    testValidInput('() => { return {} }', {});
    testValidInput('() => ( {} )', {});

    testValidInput('function() { return {} }', {});
    testValidInput('function() { return { foo: {} } }', { foo: {} });
    testValidInput('function() { return { "foo foo": {} } }', { 'foo foo': {} });
    testValidInput('function() { return { foo: { bar: 123 } } }', { foo: { bar: 123 } });
    testValidInput('function() { return { foo: { bar: "baz" } } }', { foo: { bar: 'baz' } });
    testValidInput('function(context) { return { foo: { bar: context.baz } } }', { foo: { bar: 'BAZ' } }, { baz: 'BAZ' });
    testValidInput('function() { return { foo: { bar: "baz" + "bam" } } }', { foo: { bar: 'bazbam' } });
    testValidInput('function(context) { return { foo: { bar: context.baz + " " + context.bam } } }', { foo: { bar: 'BAZ BAM' } }, { baz: 'BAZ', bam: 'BAM' });
    testValidInput('function(context) { return { foo: { bar: context.a * (context.b + context.c) + "px" } } }', { foo: { bar: '14px' } }, { a: 2, b: 3, c: 4 });
    testValidInput('function(context) { return { foo: { bar: context.a.b } } }', { foo: { bar: 'c' } }, { a: { b: 'c' } });
    testValidInput('function() { return { foo: { content: " " } } }', { foo: { content: " " } });
    testValidInput('function() { return { ["foo"]: {} } }', { foo: {} });
    testValidInput('function() { return { undefined: {} } }', { undefined: {} });

    testValidInput(`function(context) {
      return {
        foo: {
          'bar': 'baz',
          bam: 123
        },

        'test 1': {
          test2: {
            'test 3': {
              test4: 'test5'
            }
          },

          'test 6': 'test 7',

          test8: {
            'test 9': 'test 10'
          }
        }
      };
    }`, {
      foo: {
        'bar': 'baz',
        bam: 123
      },
      'test 1': {
        test2: {
          'test 3': {
            test4: 'test5'
          }
        },
        'test 6': 'test 7',
        test8: {
          'test 9': 'test 10'
        }
      }
    });

    testValidInput(`function(context) {
      const { __ios__, __android__, env } = context;
      const buttonSize = 100;
      let marginList = [10, 8, 10, 8];

      if (__ios__) {
        marginList = marginList.map(v => v - 2);
      }

      return {
        button: {
          width: buttonSize,
          margin: marginList.map(v => v + 'px').join(' '),
          color: __android__ ? 'red' : 'blue',
          border: env === 'development' ? '2px solid red' : 'none'
        },
      };
    }`, {
      button: {
        width: 100,
        margin: '8px 6px 8px 6px',
        color: 'blue',
        border: 'none',
      }
    }, {
      __ios__: true,
      __android__: false,
      env: 'production',
    });

    testValidInput(`function(context) {
      const { min } = context;

      function max(a, b) {
        return a > b ? a : b;
      }

      return {
        button: {
          width: max( 100, 90 ),
          height: min( 50, 40 ),
        },
      };
    }`, {
      button: {
        width: 100,
        height: 40,
      }
    }, {
      min: function(a, b) {
        return a < b ? a : b;
      }
    });
  });

  it('throws on invalid input', () => {
    testInvalidInput('function() { return { foo: bar }; }', /all references must be in the function\'s scope/);
    testInvalidInput('function() { throw "foo"; }', /foo/);
  });
});
