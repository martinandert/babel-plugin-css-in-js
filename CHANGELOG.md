# Changelog

Tags:

- [New Feature]
- [Bug Fix]
- [Breaking Change]
- [Documentation]
- [Internal]
- [Polish]

## v1.5.1 (January 22, 2016)

- **Bug Fix**
  - Don't validate parent selectors

## v1.5.0 (January 22, 2016)

- **New Feature**
  - Support basic theming via nesting in global selectors
- **Internal**
  - Remove Node.js v4 and v5 from Travis
  - Add Node.js v7 to Travis

## v1.4.1 (December 8, 2016)

- **Bug Fix**
  - Don't return subselector expressions as style names (#23)
- **Documentation**
  - Add section about global styles to README

## v1.4.0 (August 24, 2016)

- **New Feature**
  - Support function expressions as argument to `cssInJS` (#15)
- **Internal**
  - Add Node.js v6 to Travis

## v1.3.0 (August 24, 2016)

- **New Feature**
  - Support for global selectors (#19)
- **Polish**
  - More helpful error messages (#18)
- **Bug Fix**
  - Update tests to support -webkit-box-flex (#17)

## v1.2.3 (April 27, 2016)

- **Bug Fix**
  - Allow string value to be blank for 'content' rule (#10)

## v1.2.2 (February 27, 2016)

- **Bug Fix**
  - Fix second pass clearing the originally generated CSS

## v1.2.1 (February 27, 2016)

- **Bug Fix**
  - Allow single letter class names

## v1.2.0 (February 20, 2016)

- **New Feature**
  - Allow spaces in top-level style names
- **Internal**
  - Add a .codeclimate.yml file
  - Use airbnb's linting rules as a basis

## v1.1.0 (December 9, 2015)

- **New Feature**
  - Add option to change the identifier used to detect transformable inline styles

## v1.0.0 (December 8, 2015)

- **Polish**
  - Update dependencies

## v0.3.0 (November 22, 2015)

- **New Feature**
  - Allow using a file path as context option which will be loaded by the plugin and whose exports are used as styesheet context
- **Polish**
  - Expose important Makefile targets as npm scripts

## v0.2.0 (November 19, 2015)

- **Breaking Change**
  - Update babel packages to version 6.2.0
- **Polish**
  - Clean up code

## v0.1.0 (November 16, 2015)

First public release.
