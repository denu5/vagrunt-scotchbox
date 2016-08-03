module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        htmlmin: {                                     // Task
            dist: {                                      // Target
                options: {                                 // Target options
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {                                   // Dictionary of files
                    'myfile.min.html': 'myfile.html',     // 'destination': 'source'
                }
            },
            dev: {                                       // Another target
                files: {
                    'dist/index.html': 'src/index.html',
                    'dist/contact.html': 'src/contact.html'
                }
            }
        },
        // copy files to public -----------------------------------------
        copy: {
            html: {
                files: [{
                    cwd: 'app',  // set working folder / root to copy
                    src: '**/*',           // copy all files and subfolders
                    dest: 'public',    // destination folder
                    expand: true           // required when using cwd
                }]
            },
            bower: {
                files: [{
                    cwd: 'bower',  // set working folder / root to copy
                    src: '**/*',           // copy all files and subfolders
                    dest: 'public/bower',    // destination folder
                    expand: true           // required when using cwd
                }]
            }
        },

        // compile less stylesheets to css ---------------------------------------
        less: {
            options: {
                banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n',
                cleancss:true
            },
            build: {
                files: {
                    'assets/css/style.css': 'assets/less/style.less'
                }
            }
        },

    });

    // Load the plugin that provides the task.
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');

    // Default task(s).
    grunt.registerTask('default', ['copy','less']);

};