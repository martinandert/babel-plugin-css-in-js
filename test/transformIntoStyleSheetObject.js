import assert from 'assert';
import { parse } from 'babylon';
import transform from '../src/transformIntoStyleSheetObject';

describe('transformIntoStyleSheetObject', () => {
  function getExprAndCode(source) {
		var code = 'var _ =' + source;
		var expr = parse('var _ =' + source).program.body[0].declarations[0].init;

		return { code: code, expr: expr };
  }

  function testValidInput(input, expected, context) {
    var exprAndCode = getExprAndCode(input);

    assert.deepEqual(transform(exprAndCode.expr, context, exprAndCode.code), expected);
  }

  function testInvalidInput(input, message) {
    var exprAndCode = getExprAndCode(input);

    assert.throws(() => {
      transform(exprAndCode.expr, void 0, exprAndCode.code);
    }, message || assert.AssertionError);
  }

  it('transforms valid input properly', () => {
    testValidInput('{}', {});
    testValidInput('function() { return {} }', {});
    testValidInput('()=>{ return {} }', {});
    testValidInput('()=>( {} )', {});

    testValidInput('{ foo: {} }', { foo: {} });
    testValidInput('function() { return { foo: {} } }', { foo: {} });
    testValidInput('()=>{ return { foo: {} } }', { foo: {} });

    testValidInput('{ "foo foo": {} }', { 'foo foo': {} });
    testValidInput('function() { return { "foo foo": {} } }', { 'foo foo': {} });
    testValidInput('()=>{ return { "foo foo": {} } }', { 'foo foo': {} });

    testValidInput('{ foo: { bar: 123 } }', { foo: { bar: 123 } });
    testValidInput('function() { return { foo: { bar: 123 } } }', { foo: { bar: 123 } });
    testValidInput('()=>{ return { foo: { bar: 123 } } }', { foo: { bar: 123 } });

    testValidInput('{ foo: { bar: "baz" } }', { foo: { bar: 'baz' } });
    testValidInput('function() { return { foo: { bar: "baz" } } }', { foo: { bar: 'baz' } });
    testValidInput('()=>{ return { foo: { bar: "baz" } } }', { foo: { bar: 'baz' } });


    testValidInput('{ foo: { bar: baz } }', { foo: { bar: 'BAZ' } }, { baz: 'BAZ' });
    testValidInput('function(context) { return { foo: { bar: context.baz } } }', { foo: { bar: 'BAZ' } }, { baz: 'BAZ' });
    testValidInput('(context)=>{ return { foo: { bar: context.baz } } }', { foo: { bar: 'BAZ' } }, { baz: 'BAZ' });


    testValidInput('{ foo: { bar: "baz" + "bam" } }', { foo: { bar: 'bazbam' } });
    testValidInput('function() { return { foo: { bar: "baz" + "bam" } } }', { foo: { bar: 'bazbam' } });
    testValidInput('()=>{ return { foo: { bar: "baz" + "bam" } } }', { foo: { bar: 'bazbam' } });


    testValidInput('{ foo: { bar: baz + " " + bam } }', { foo: { bar: 'BAZ BAM' } }, { baz: 'BAZ', bam: 'BAM' });
    testValidInput('function(context) { return { foo: { bar: context.baz + " " + context.bam } } }', { foo: { bar: 'BAZ BAM' } }, { baz: 'BAZ', bam: 'BAM' });
    testValidInput('(context)=>{ return { foo: { bar: context.baz + " " + context.bam } } }', { foo: { bar: 'BAZ BAM' } }, { baz: 'BAZ', bam: 'BAM' });


    testValidInput('{ foo: { bar: a * (b + c) + "px" } }', { foo: { bar: '14px' } }, { a: 2, b: 3, c: 4 });
    testValidInput('function(context) { return { foo: { bar: context.a * (context.b + context.c) + "px" } } }', { foo: { bar: '14px' } }, { a: 2, b: 3, c: 4 });
    testValidInput('(context)=>{ return { foo: { bar: context.a * (context.b + context.c) + "px" } } }', { foo: { bar: '14px' } }, { a: 2, b: 3, c: 4 });


    testValidInput('{ foo: { bar: a.b } }', { foo: { bar: 'c' } }, { a: { b: 'c' } });
    testValidInput('function(context) { return { foo: { bar: context.a.b } } }', { foo: { bar: 'c' } }, { a: { b: 'c' } });
    testValidInput('(context)=>{ return { foo: { bar: context.a.b } } }', { foo: { bar: 'c' } }, { a: { b: 'c' } });


    testValidInput('{ foo: { content: " " } }', { foo: { content: " " } });
    testValidInput('function() { return { foo: { content: " " } } }', { foo: { content: " " } });
    testValidInput('()=>{ return { foo: { content: " " } } }', { foo: { content: " " } });


    testValidInput('{ ["foo"]: {} }', { foo: {} });
    testValidInput('function() { return { ["foo"]: {} } }', { foo: {} });
    testValidInput('()=>{ return { ["foo"]: {} } }', { foo: {} });


    testValidInput('{ undefined: {} }', { undefined: {} });
    testValidInput('function() { return { undefined: {} } }', { undefined: {} });
    testValidInput('()=>{ return { undefined: {} } }', { undefined: {} });


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
    testInvalidInput('"foo"',     /must be a object expression or function expression/);
    testInvalidInput('123',       /must be a object expression or function expression/);
    testInvalidInput('[]',        /must be a object expression or function expression/);
    testInvalidInput('true',      /must be a object expression or function expression/);
    testInvalidInput('false',     /must be a object expression or function expression/);
    testInvalidInput('null',      /must be a object expression or function expression/);
    testInvalidInput('undefined', /must be a object expression or function expression/);

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
