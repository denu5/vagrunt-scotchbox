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
                    cwd: 'public_dev',  // set working folder / root to copy
                    src: '**/*',           // copy all files and subfolders
                    dest: 'public_html',    // destination folder
                    expand: true           // required when using cwd
                }]
            },
            //
            //bower: {
            //    files: [{
            //        cwd: 'bower',  // set working folder / root to copy
            //        src: '**/*',           // copy all files and subfolders
            //        dest: 'public/bower',    // destination folder
            //      expand: true           // required when using cwd
            //    }]
            //}
        },

        // compile less stylesheets to css ---------------------------------------
        less: {
            options: {
                banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n',
                cleancss:true
            },
            build: {
                files: {
                    'public_dev/assets/css/style.css': 'public_dev/assets/less/style.less'
                }
            }
        },
        clean: {
            public: ['public_html'] //remove folder because of "removed-files-issue"
        }

    });

    // Load the plugin that provides the task.
    //grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    grunt.registerTask('default', ['less','clean:public','copy']);


};