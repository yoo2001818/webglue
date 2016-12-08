var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: 'client',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    chunkFilename: '[id].js',
    pathinfo: true
  },
  resolve: {
    root: path.join(__dirname, 'client-test'),
    extensions: ['', '.js'],
    modulesDirectories: ['node_modules'],
    alias: {
      webglue: path.join(__dirname, 'src')
    }
  },
  // devtool: 'source-map',
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      title: 'WebGLue'
    })
  ],
  module: {
    loaders: [
      {
        test: /\.js$/i,
        exclude: /node_modules/,
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
        test: /\.css$/i,
        loader: 'style!css'
      },
      {
        test: /(\.vert|\.frag|\.obj|\.mtl|\.dae)$/i,
        loader: 'raw'
      },
      {
        test: /\.(otf|eot|svg|ttf|woff|woff2)(\?.+)?$/,
        loader: 'url-loader?limit=10240'
      },
      {
        test: /\.(png|jpe?g|gif|tiff|mp4|mkv|webm)?$/,
        loader: 'file-loader'
      }
    ]
  }
};
