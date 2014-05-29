module.exports = function(grunt) {
    "use strict";

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {

        }
    });

    // Load the plugins needed
    grunt.loadNpmTasks("grunt-contrib-sass");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask('start', function() {
        grunt.util.spawn({
            cmd: 'node',
            args: ['server.js']
        });
    });

    // Named tasks to run
    grunt.registerTask('default', ['karma:unit']);
    grunt.registerTask('test-continuous', ['karma:unit', 'watch:scripts']);
    grunt.registerTask('test-unit', ['karma:unit']);
    grunt.registerTask('readme', ['marked:readme']);
};