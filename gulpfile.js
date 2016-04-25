var gulp = require('gulp');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
require('babel-register');

// TODO: Add code coverage tool

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('test', ['lint']);

gulp.task('watch', function() {
  return gulp.watch(['src/**/*.js', 'test/**/*.js'], ['mochaSimple']);
});

gulp.task('babel', function() {
  return gulp.src(['src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('default', ['babel']);
