var gulp = require('gulp'),
    less = require('gulp-less'),
    watch = require('gulp-watch');

gulp.task('less', function() {
    gulp.src('static/styles/*.less')
        .pipe(watch('static/styles/*.less', ['less']))
        .pipe(less())
        .pipe(gulp.dest('static/styles'));
});
