'use strict';

require('dotenv').config();

const request = require('request');
const gulp    = require('gulp');
const sass    = require('gulp-sass');
const notify = require("gulp-notify");
const path    = require('path');
const fs      = require('fs');

gulp.task('sass', () => {
    return gulp.src('./sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist'));
});

gulp.task('sass:watch', () => {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('zendesk:watch', () => {
    gulp.watch(['./dist/*', './templates/*'], ['zendesk']);
});

// Zendesk upload
gulp.task('zendesk', () => {

    const templatesFolder     = path.resolve(__dirname, 'templates') + '/'
    const distFolder          = path.resolve(__dirname, 'dist') + '/'

    var templatesContent      = []
    var styleContent          = null
    var scriptContent         = null
    var numberOfTemplateFiles = 0;

    fs.readdir(templatesFolder, function(err, filenames) {
        if (err) {
            console.error(err)
            return;
        }

        numberOfTemplateFiles += filenames.length

        filenames.forEach(function(fileName) {
            fs.readFile(templatesFolder + fileName, 'utf-8', function(err, content) {
                if (err) {
                    console.error(err)
                    return;
                }
                const name = fileName.split('.')[0]

                handleContent(name, content)
            });
        });
    });


    fs.readFile(distFolder + 'style.css', 'utf-8', function(err, content) {
        if (err) {
            console.error(err)
            return
        }

        styleContent = content
        handleContent()
    });

    fs.readFile(distFolder + 'scripts.js', 'utf-8', function(err, content) {
        if (err) {
            console.error(err)
            return
        }

        scriptContent = content
        handleContent()
    });

    const handleContent = (templateName, templateContent) => {
        if(templateName !== undefined && templateContent !== undefined) {
            templatesContent.push({
                identifier: templateName,
                body: templateContent
            })
        }

        if( templatesContent.length == numberOfTemplateFiles && styleContent !== null && scriptContent !== null ) {
            makeRequest()
        }
    };

    const makeRequest = () => {
        console.log('Uploading to Zendesk');

        request('https://' + process.env.HOST + '/hc/admin/themes/' + process.env.THEME_ID, {
            method: 'PUT',
            headers: {
                'Cookie': process.env.COOKIE,
                'X-CSRF-Token': process.env.CSRF_TOKEN,
            },
            body: {
                id: process.env.THEME_ID,
                javascript: scriptContent,
                stylesheet: styleContent,
                templates_attributes: templatesContent,
            },
            json: true,
        }, function(err, res, body) {
            publishChanges()
        })
    }

    const publishChanges = () => {
        request('https://' + process.env.HOST + '/hc/admin/help_centers/' + process.env.HC_ID, {
            method: 'PUT',
            headers: {
                'Cookie': process.env.COOKIE,
                'X-CSRF-Token': process.env.CSRF_TOKEN,
            },
            body: {
                "id":process.env.HC_ID,
                "theme_id": process.env.THEME_ID,
                "draft_theme_id": process.env.THEME_ID,
                "state":"enabled",
            },
            json: true,
        }, function(err, res, body) {
            request('https://' + process.env.HOST + '/hc/admin/help_centers/' + process.env.HC_ID + '/apply', {
                method: 'PUT',
                headers: {
                    'Cookie': process.env.COOKIE,
                    'X-CSRF-Token': process.env.CSRF_TOKEN,
                },
                body: {
                    "id": process.env.HC_ID,
                    "theme_id": process.env.THEME_ID,
                    "state": "enabled",
                    "draft_theme_id": process.env.THEME_ID,
                },
                json: true,
            }, function(err, res, body) {
                console.log('Changes have been published in Zendesk')
            })
        })
    }
});