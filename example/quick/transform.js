// run in this directory with `node transform.js`

var fs = require('fs');
var babel = require('babel-core');

var code = fs.readFileSync('Button.js', 'utf8');
var result;


/* without setting any options */
result = babel.transform(code, {
  filename: 'Button.js',
  plugins: [
    'css-in-js'
  ]
});

fs.writeFileSync('Button.transformed.js',  result.code);
fs.writeFileSync('Button.transformed.css', result.metadata.css);


/* with vendor-prefixing and class name compression */
result = babel.transform(code, {
  filename: 'Button.js',
  plugins: [
    ['css-in-js', { vendorPrefixes: true, compressClassNames: true }]
  ]
});

fs.writeFileSync('Button.transformed.compressed.js', result.code);
fs.writeFileSync('Button.transformed.compressed.css', result.metadata.css);
