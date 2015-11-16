import assert from 'assert';
import transform from '../src/transformStyleSheetObjectIntoSpecification';

describe('transformStyleSheetObjectIntoSpecification', () => {
  function testValidInput(input, expected) {
    assert.deepEqual(transform(input), expected);
  }

  function testInvalidInput(input, message) {
    assert.throws(() => {
      transform(input);
    }, message || assert.AssertionError);
  }

  it('transforms valid input properly', () => {
    testValidInput({}, {});

    testValidInput({
      foo: {
        color: 'red',
        padding: 10
      }
    }, {
      foo: {
        rules: {
          color: 'red',
          padding: 10
        },
        selectors: {},
        mediaQueries: {},
      }
    });

    testValidInput({
      'foo:hover': {
        color: 'red',
        padding: 10
      }
    }, {
      foo: {
        rules: {},
        selectors: {
          ':hover': {
            rules: {
              color: 'red',
              padding: 10
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      'foo:hover': {
        color: 'red',
        padding: 10
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              color: 'red',
              padding: 10
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'red',
          padding: 10
        }
      },
      'foo:hover': {
        color: 'blue',
        font: 'Arial'
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              color: 'blue',
              padding: 10,
              font: 'Arial'
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              color: 'red',
              padding: 10
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        '@media': {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {},
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {}
          }
        }
      }
    });

    testValidInput({
      '@media': {
        foo: {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {},
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {}
          }
        }
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {}
          }
        }
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'blue',
            padding: 5
          }
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  padding: 5
                }
              }
            }
          }
        }
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'black',
            margin: 1
          }
        },
        'foo:hover': {
          color: 'blue',
          padding: 5
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  margin: 1,
                  padding: 5
                }
              }
            }
          }
        }
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'black',
          margin: 1
        }
      },
      'foo:hover': {
        color: 'blue',
        padding: 5
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'black',
            margin: 1
          }
        },
        'foo:hover': {
          color: 'blue',
          padding: 5
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              color: 'blue',
              margin: 1,
              padding: 5
            }
          }
        },
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  margin: 1,
                  padding: 5
                }
              }
            }
          }
        }
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'black',
          margin: 1
        },
        '@media': {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'blue',
            padding: 5,
            ':active': {
              color: 'red',
              padding: 10
            }
          }
        }
      },
      'foo:hover': {
        color: 'blue',
        padding: 5
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              color: 'blue',
              margin: 1,
              padding: 5
            }
          }
        },
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  padding: 5
                }
              },
              ':hover:active': {
                rules: {
                  color: 'red',
                  padding: 10
                }
              }
            }
          }
        }
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'black',
          margin: 1,
          ':active': {
            color: 'white'
          }
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              color: 'black',
              margin: 1
            }
          },
          ':hover:active': {
            rules: {
              color: 'white'
            }
          }
        },
        mediaQueries: {}
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        '[disabled]': {
          color: 'black',
          margin: 1,
          ':active': {
            color: 'white'
          }
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          '[disabled]': {
            rules: {
              color: 'black',
              margin: 1
            }
          },
          '[disabled]:active': {
            rules: {
              color: 'white'
            }
          }
        },
        mediaQueries: {}
      }
    });

    testValidInput({
      'foo[disabled]': {
        color: 'green',
        padding: 15,
        ':active': {
          color: 'white'
        }
      }
    }, {
      foo: {
        rules: {
        },
        selectors: {
          '[disabled]': {
            rules: {
              color: 'green',
              padding: 15
            }
          },
          '[disabled]:active': {
            rules: {
              color: 'white'
            }
          }
        },
        mediaQueries: {}
      }
    });

    testValidInput({
      'foo[disabled]:active': {
        color: 'green',
        padding: 15
      }
    }, {
      foo: {
        rules: {
        },
        selectors: {
          '[disabled]:active': {
            rules: {
              color: 'green',
              padding: 15
            }
          }
        },
        mediaQueries: {}
      }
    });

    testValidInput({
      foo: {
        margin: 0,
        fontFamily: 'Arial,Verdana,sans-serif',
        '@media only screen and (min-width: 120px)': {
          lineHeight: 1.23,
          display: 'block'
        },
        '@media only screen and (min-width: 700px)': {
          lineHeight: 1.53,
          display: 'inline-block',
          ':focus': {
            outline: 'none'
          }
        }
      },
      bar: {
        border: 'solid 1px black',
        padding: 15,

        ':hover': {
          borderColor: '#333',
          color: 'blue'
        }
      },
      'foo:first-child': {
        border: 'none',
        margin: 1
      },
      '@media only screen and (min-width: 120px)': {
        foo: {
          display: 'inline',
          padding: 0,
          ':focus': {
            cursor: 'pointer',
            fontSize: 12
          }
        },
        'foo:hover': {
          margin: 0
        },
        baz: {
          color: 'red'
        },
        'bam:active': {
          color: 'green'
        }
      }
    }, {
      foo: {
        rules: {
          margin: 0,
          fontFamily: 'Arial,Verdana,sans-serif'
        },
        selectors: {
          ':first-child': {
            rules: {
              border: 'none',
              margin: 1
            }
          }
        },
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {
              lineHeight: 1.23,
              display: 'inline',
              padding: 0
            },
            selectors: {
              ':focus': {
                rules: {
                  cursor: 'pointer',
                  fontSize: 12
                }
              },
              ':hover': {
                rules: {
                  margin: 0
                }
              }
            }
          },
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
        }
      },
      bar: {
        rules: {
          border: 'solid 1px black',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              borderColor: '#333',
              color: 'blue'
            }
          }
        },
        mediaQueries: {}
      },
      baz: {
        rules: {},
        selectors: {},
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {
              color: 'red'
            },
            selectors: {}
          }
        }
      },
      bam: {
        rules: {},
        selectors: {},
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {},
            selectors: {
              ':active': {
                rules: {
                  color: 'green'
                }
              }
            }
          }
        }
      }
    });
  });

  it('throws on invalid input', () => {
    testInvalidInput("foo",     /value must be a plain object/);
    testInvalidInput(123,       /value must be a plain object/);
    testInvalidInput([],        /value must be a plain object/);
    testInvalidInput(true,      /value must be a plain object/);
    testInvalidInput(false,     /value must be a plain object/);
    testInvalidInput(null,      /value must be a plain object/);
    testInvalidInput(undefined, /value must be a plain object/);

    testInvalidInput({ foo: "bar" },                /value must be a plain object/);
    testInvalidInput({ '@media': "bar" },           /value must be a plain object/);
    testInvalidInput({ '@media': { foo: "bar" } },  /value must be a plain object/);
    testInvalidInput({ foo: { '@media': "bar" } },  /value must be a plain object/);

    testInvalidInput({ foo: { 'bar:hover': {} } },                /styles cannot be nested into each other/);
    testInvalidInput({ foo: { '@media': { 'bar:hover': {} } } },  /styles cannot be nested into each other/);
    testInvalidInput({ foo: { ':hover': { 'bar:focus': {} } } },  /styles cannot be nested into each other/);
    testInvalidInput({ '@media': { foo: { ':focus': { 'bar:hover': {} } } } },  /styles cannot be nested into each other/);

    testInvalidInput({ '@media1': { '@media2': {} } },                        /media queries cannot be nested into each other/);
    testInvalidInput({ '@media1': { foo: { '@media2': {} } } },               /media queries cannot be nested into each other/);
    testInvalidInput({ foo: { '@media1': { '@media2': {} } } },               /media queries cannot be nested into each other/);
    testInvalidInput({ foo: { '@media1': { ':hover': { '@media2': {} } } } }, /media queries cannot be nested into each other/);

    testInvalidInput({ foo: { ':hover': { '@media': {} } } }, /media queries cannot be nested into selectors/);
    testInvalidInput({ 'foo:hover': { '@media': {} } },       /media queries cannot be nested into selectors/);

    testInvalidInput({ foo: { bar: {} } },                /value must be a number or a string/);
    testInvalidInput({ foo: { ':hover': { bar: {} } } },  /value must be a number or a string/);
    testInvalidInput({ foo: { '@media': { bar: {} } } },  /value must be a number or a string/);

    testInvalidInput({ ':hover': {} },                /stand-alone selectors are not allowed at the top-level/);
    testInvalidInput({ '@media1': { ':hover': {} } }, /stand-alone selectors are not allowed in top-level media queries/);

    testInvalidInput({ 'foo bar': {} },     /style name is invalid/);
  });
});
