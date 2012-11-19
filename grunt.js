module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      lint: {
        files: '*.js',
        tasks: 'lint'
      }
    },

    lint: {
      files: [
        '*.js'
      ]
    },

    jshint: {
      options: {
        scripturl: true, // Don't bug about scripts in urls
        laxcomma: true, // Don't bug about commas at the start of lines
        loopfunc: true, // Don't bug about functions calls in loops
        lastsemic: true, // Don't bug if a one line function has no semicolon
        evil: true
      }
    }
  });
};
