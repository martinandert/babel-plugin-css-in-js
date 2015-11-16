import assert from 'assert';
import transform from '../src/transformSpecificationIntoCSS';

describe('transformSpecificationIntoCSS', () => {
  function testCSS(spec, expected, options) {
    assert.equal(transform(spec, options), expected);
  }

  function css(str) {
    return str[0].replace(/\n      /g, '\n').trim();
  }

  it('works for rules', () => {
    testCSS({
      foo: {
        rules: {
          fontFamily: 'Arial,Verdana,"Helvetica Neue",sans-serif',
          margin: 10,
          padding: '0 20px'
        }
      },
      bar: {
        rules: {
          border: 'solid 1px black'
        }
      }
    }, css`
      .foo {
        font-family: Arial,Verdana,"Helvetica Neue",sans-serif;
        margin: 10px;
        padding: 0 20px;
      }
      .bar {
        border: solid 1px black;
      }
    `);
  });

  it('works for pseudo-classes', () => {
    testCSS({
      foo: {
        selectors: {
          ':hover': {
            rules: {
              margin: 10,
              padding: '0 20px'
            }
          },
          ':first-child': {
            rules: {
              marginTop: 0
            }
          }
        }
      }
    }, css`
      .foo:hover {
        margin: 10px;
        padding: 0 20px;
      }
      .foo:first-child {
        margin-top: 0px;
      }
    `);
  });

  it('works for media queries', () => {
    testCSS({
      foo: {
        mediaQueries: {
          'media only screen and (min-width: 500px)': {
            rules: {
              marginTop: 0
            },
            selectors: {
              ':hover': {
                rules: {
                  margin: 10,
                  padding: '0 20px'
                }
              }
            }
          },
          'media only screen and (min-width: 1000px)': {
            rules: {
              marginTop: 10
            },
          }
        }
      }
    }, css`
      @media only screen and (min-width: 500px) {
        .foo {
          margin-top: 0px;
        }
        .foo:hover {
          margin: 10px;
          padding: 0 20px;
        }
      }
      @media only screen and (min-width: 1000px) {
        .foo {
          margin-top: 10px;
        }
      }
    `);
  });

  it('allows media query shortcuts through option', () => {
    testCSS({
      foo: {
        mediaQueries: {
          mobile: {
            rules: {
              marginTop: 0
            }
          },
          tablet: {
            rules: {
              marginTop: 10
            },
          },
          'media no-shortcut': {
            rules: {
              marginTop: 20
            },
          }
        }
      }
    }, css`
      @media mobile-sized {
        .foo {
          margin-top: 0px;
        }
      }
      @media tablet-sized {
        .foo {
          margin-top: 10px;
        }
      }
      @media no-shortcut {
        .foo {
          margin-top: 20px;
        }
      }
    `, {
      mediaMap: {
        mobile: 'media mobile-sized',
        tablet: 'media tablet-sized'
      }
    });
  });

  it('respects prefix option', () => {
    testCSS({
      foo: {
        rules: {
          margin: 0
        },
        selectors: {
          ':hover': {
            rules: {
              padding: 0
            }
          }
        }
      }
    }, css`
      .my-prefix-foo {
        margin: 0px;
      }
      .my-prefix-foo:hover {
        padding: 0px;
      }
    `, {
      prefix: 'my-prefix'
    });
  });

  it('respects prefixes option', () => {
    testCSS({
      foo: {
        rules: {
          margin: 0
        },
        selectors: {
          ':hover': {
            rules: {
              padding: 0
            }
          }
        }
      }
    }, css`
      .a-b-foo {
        margin: 0px;
      }
      .a-b-foo:hover {
        padding: 0px;
      }
    `, {
      prefixes: ['a', 'b']
    });
  });

  it('respects compressClassNames option', () => {
    let uncompressed = transform({ foo_bar_baz: { rules: { margin: 0 } } });
    let compressed   = transform({ foo_bar_baz: { rules: { margin: 0 } } }, { compressClassNames: true });

    assert(uncompressed.length);
    assert(compressed.length);

    assert(uncompressed.length > compressed.length);
  });

  it('ignores empty media queries', () => {
    testCSS({
      foo: {
        rules: {
          margin: 0
        },
        mediaQueries: {
          'media1': {
            rules: {
              margin: 1
            }
          },
          'media2': {
            rules: {

            }
          }
        }
      }
    }, css`
      .foo {
        margin: 0px;
      }
      @media1 {
        .foo {
          margin: 1px;
        }
      }
    `);
  });
});
