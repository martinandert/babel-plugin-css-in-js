import assert from 'assert';
import { parse } from 'babylon';
import transform from '../src/transformObjectExpressionIntoStyleSheetObject';

describe('transformObjectExpressionIntoStyleSheetObject', () => {
  function makeObjectExpression(source) {
    return parse('var _ = ' + source).program.body[0].declarations[0].init;
  }

  function testValidInput(input, expected, context) {
    var expr = makeObjectExpression(input);

    assert.deepEqual(transform(expr, context), expected);
  }

  function testInvalidInput(input, message) {
    var expr = makeObjectExpression(input);

    assert.throws(() => {
      transform(expr);
    }, message || assert.AssertionError);
  }

  it('transforms valid input properly', () => {
    testValidInput('{}', {});
    testValidInput('{ foo: {} }', { foo: {} });
    testValidInput('{ "foo foo": {} }', { 'foo foo': {} });
    testValidInput('{ foo: { bar: 123 } }', { foo: { bar: 123 } });
    testValidInput('{ foo: { bar: "baz" } }', { foo: { bar: 'baz' } });
    testValidInput('{ foo: { bar: baz } }', { foo: { bar: 'BAZ' } }, { baz: 'BAZ' });
    testValidInput('{ foo: { bar: "baz" + "bam" } }', { foo: { bar: 'bazbam' } });
    testValidInput('{ foo: { bar: baz + " " + bam } }', { foo: { bar: 'BAZ BAM' } }, { baz: 'BAZ', bam: 'BAM' });
    testValidInput('{ foo: { bar: a * (b + c) + "px" } }', { foo: { bar: '14px' } }, { a: 2, b: 3, c: 4 });
    testValidInput('{ foo: { bar: a.b } }', { foo: { bar: 'c' } }, { a: { b: 'c' } });
    testValidInput('{ ["foo"]: {} }', { foo: {} });
    testValidInput('{ undefined: {} }', { undefined: {} });
    testValidInput(`{
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
  });

  it('throws on invalid input', () => {
    testInvalidInput('"foo"',     /must be a object expression/);
    testInvalidInput('123',       /must be a object expression/);
    testInvalidInput('[]',        /must be a object expression/);
    testInvalidInput('true',      /must be a object expression/);
    testInvalidInput('false',     /must be a object expression/);
    testInvalidInput('null',      /must be a object expression/);
    testInvalidInput('undefined', /must be a object expression/);

    testInvalidInput('{ foo: "bar" }',  /top-level value must be a object expression/);
    testInvalidInput('{ foo: [] }',     /top-level value must be a object expression/);

    testInvalidInput('{ foo: { bar: null } }',  /value must be a string or number/);
    testInvalidInput('{ foo: { bar: true } }',  /value must be a string or number/);
    testInvalidInput('{ foo: { bar: false } }', /value must be a string or number/);
    testInvalidInput('{ foo: { bar: null } }',  /value must be a string or number/);
    testInvalidInput('{ foo: { bar: "" } }',    /string value cannot be blank/);
    testInvalidInput('{ foo: { bar: "  " } }',  /string value cannot be blank/);

    testInvalidInput('{ foo: { bar: [] } }',              /invalid value expression type/);
    testInvalidInput('{ foo: { bar: Math.PI } }',         /invalid value expression type/);
    testInvalidInput('{ foo: { bar: undefined } }',       /invalid value expression type/);
    testInvalidInput('{ foo: { bar: missing + "bam" } }', /invalid value expression type/);
    testInvalidInput('{ foo: { bar: baz[0] } }',          /invalid value expression type/);

    testInvalidInput('{ [null]: {} }',  /key must be a string or identifier/);
    testInvalidInput('{ [123]: {} }',   /key must be a string or identifier/);
    testInvalidInput('{ [true]: {} }',  /key must be a string or identifier/);
    testInvalidInput('{ [false]: {} }', /key must be a string or identifier/);
  });
});
