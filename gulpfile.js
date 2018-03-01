var gulp = require('gulp');
var babel = require('gulp-babel');
var wrap = require('gulp-wrap');
var revertPath = require('gulp-revert-path');
var eslint = require('gulp-eslint');
var gutil = require('gulp-util');
var webpack = require('webpack');
var path = require('path');

// TODO: Add code coverage tool

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js', 'client-test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('webpackLib', function(callback) {
  // run webpack
  webpack({
    entry: './src/index.js',
    output: {
      path: path.join(__dirname, 'lib'),
      filename: 'webglue.dist.js',
      library: 'webglue',
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    module: {
      loaders: [
        {
          test: /\.jsx?$/i,
          exclude: /node_modules/,
          loader: 'babel'
        },
        {
          test: /\.json$/i,
          loader: 'json'
        },
      ]
    }
  }, function(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString({}));
    callback();
  });
});

gulp.task('test', ['lint']);

gulp.task('babel', function() {
  return gulp.src(['src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('wrap', function() {
  return gulp.src(['src/**/*.vert', 'src/**/*.frag'])
    .pipe(wrap('module.exports = `<%= contents %>`;', {}, { parse: false }))
    .pipe(babel())
    .pipe(revertPath())
    .pipe(gulp.dest('lib'));
});

gulp.task('default', ['babel', 'wrap', 'webpackLib']);
