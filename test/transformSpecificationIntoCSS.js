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
      },
      'foo p': {
        rules: {
          margin: 0
        },
        selectors: {
          ':nth-child(2)': {
            rules: {
              backgroundColor: 'green'
            }
          },
          ':nth-of-type(3)': {
            rules: {
              backgroundColor: 'red'
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
      .foo p {
        margin: 0px;
      }
      .foo p:nth-child(2) {
        background-color: green;
      }
      .foo p:nth-of-type(3) {
        background-color: red;
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

  it('supports global selectors', () => {
    testCSS({
      '$.foo': {
        rules: {
          fontFamily: 'Arial,Verdana,"Helvetica Neue",sans-serif',
          margin: 10,
          padding: '0 20px'
        }
      },
      '$body': {
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
      body {
        border: solid 1px black;
      }
    `);
  });

  it('supports parent nesting', () => {
    testCSS({
      foo: {
        rules: {
          padding: 0,
        },
        selectors: {},
        mediaQueries: {},
        parents: {
          'body.x': {
            rules: {
              margin: 0,
              fontFamily: 'Arial,Verdana,sans-serif',
            },
            selectors: {
              ':first-child': {
                rules: {
                  border: 'none',
                  margin: 1,
                },
              },
            },
            mediaQueries: {
              'media only screen and (min-width: 700px)': {
                rules: {
                  lineHeight: 1.53,
                  display: 'inline-block'
                },
                selectors: {
                  ':focus': {
                    rules: {
                      outline: 'none'
                    }
                  }
                }
              }
            },
          },
          'body.y': {
            rules: {
              margin: 10,
            },
            selectors: {},
            mediaQueries: {},
          },
        },
      },
      bar: {
        rules: {},
        selectors: {},
        mediaQueries: {},
        parents: {
          'body.x': {
            rules: {
              border: 'solid 1px black',
              padding: 15,
            },
            selectors: {
              ':hover': {
                rules: {
                  borderColor: '#333',
                  color: 'blue',
                },
              },
            },
            mediaQueries: {},
          },
        },
      },
      baz: {
        rules: {},
        selectors: {},
        mediaQueries: {},
        parents: {
          'body.x': {
            rules: {},
            selectors: {},
            mediaQueries: {
              'media only screen and (min-width: 120px)': {
                rules: {
                  color: 'red',
                },
                selectors: {},
              },
            },
          },
        },
      },
    }, css`
      .foo {
        padding: 0px;
      }
      body.x .foo {
        margin: 0px;
        font-family: Arial,Verdana,sans-serif;
      }
      body.x .foo:first-child {
        border: none;
        margin: 1px;
      }
      @media only screen and (min-width: 700px) {
        body.x .foo {
          line-height: 1.53;
          display: inline-block;
        }
        body.x .foo:focus {
          outline: none;
        }
      }
      body.y .foo {
        margin: 10px;
      }
      body.x .bar {
        border: solid 1px black;
        padding: 15px;
      }
      body.x .bar:hover {
        border-color: #333;
        color: blue;
      }
      @media only screen and (min-width: 120px) {
        body.x .baz {
          color: red;
        }
      }
    `);
  });
});
