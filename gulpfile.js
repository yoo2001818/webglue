var gulp = require('gulp');
var babel = require('gulp-babel');
var wrap = require('gulp-wrap');
var revertPath = require('gulp-revert-path');
var eslint = require('gulp-eslint');

// TODO: Add code coverage tool

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js', 'client-test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
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

gulp.task('default', ['babel', 'wrap']);
