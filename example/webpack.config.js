'use strict';

var webpack = require('webpack');

function plugins() {
  var all = [];

  var production = [
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } })
  ];

  return process.env.NODE_ENV === 'production' ? all.concat(production) : all;
}

module.exports = {
  cache: true,
  entry: './src/client.js',

  output: {
    filename:   'bundle.js',
    path:       'public',
    publicPath: '/'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel'
      }
    ]
  },

  plugins: plugins()
};
