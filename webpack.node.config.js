var path = require('path');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');

module.exports = {
  context: __dirname,
  entry: './client-test/client.js',
  output: {
    path: path.resolve(__dirname, 'dist-node'),
    filename: 'bundle.js',
    chunkFilename: '[id].js'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      __CLIENT__: false,
      __SERVER__: true
    })
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/i,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      },
      {
        test: /\.json$/i,
        loader: 'json'
      },
      {
        test: /\.html?$/i,
        loader: 'html'
      },
      {
        test: /(\.vert|\.frag|\.obj|\.mtl)$/i,
        loader: 'raw'
      },
      {
        test: /\.(otf|eot|svg|ttf|woff|woff2)(\?.+)?$/,
        loader: 'url-loader?limit=10240'
      },
      {
        test: /\.(png|jpe?g|gif|tiff)?$/,
        loader: 'file-loader'
      }
    ]
  },
  target: 'node',
  externals: [nodeExternals()]
};
