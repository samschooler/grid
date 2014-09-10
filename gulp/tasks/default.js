'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var map = require('map-stream');

gulp.task('prebuild', ['index', 'styles', 'images', 'assets', 'templates', 'lint']);

gulp.task('watchServe', ['watchify', 'watch', 'serve']);


module.exports = gulp.task('default', function (cb) {
    if (release) {
        runSequence(
            'clean',
            'prebuild',
            'browserify',
            'minify',
            cb
        );
    } else {
        runSequence(
            'clean',
            'prebuild',
            'watchServe',
            cb
        );
    }
});
