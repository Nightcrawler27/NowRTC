module.exports = function(grunt) {
    "use strict";

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },
        concat: {
            dist: {
                src: ['src/_nowRTC.js', 'src/browserCompatibility.js', 'src/signaling/*.js', 'src/NRTC*.js'],
                dest: 'dist/now-rtc.js'
            }
        },
        marked: {
            readme: {
                files: {
                    'README.html': 'README.md'
                }
            }
        }
    });

    // Load the plugins needed
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-marked');


    // Named tasks to run
    grunt.registerTask('default', ['karma:unit']);
    grunt.registerTask('test-continuous', ['karma:unit', 'watch:scripts']);
    grunt.registerTask('test-unit', ['karma:unit']);
    grunt.registerTask('readme', ['marked:readme']);
};
