var gulp = require('gulp');
var config = require('config');
var theme = require('zendesk-guide-pusher');

gulp.task('default', function() {
	console.log('Tasks available: download, upload')
})

gulp.task('download', function(done) {
	theme.download(config)
	.then(function() {
		done();
	});
});

gulp.task('upload', function(done) {
	theme.upload(config)
	.then(function() {
		done();
	});
});

gulp.task('publish', function(done) {
	theme.publish(config)
	.then(function() {
		done();
	});
});
