'use strict';

var _ = require('underscore.string')
  , fs = require('fs')
  , path = require('path')

  , bowerDir = JSON.parse(fs.readFileSync('.bowerrc')).directory + path.sep;

module.exports = function (gulp, $, config) {
  var isProd = $.yargs.argv.stage === 'prod';

  // delete build directory
  gulp.task('clean', function () {
    return $.del(config.buildDir);
  });

  // compile markup files and copy into build directory
  gulp.task('markup', ['clean'], function () {
    return gulp.src([
      config.appMarkupFiles,
      '!' + config.appComponents
    ])
      .pipe(gulp.dest(config.buildDir));
  });

  // compile styles and copy into build directory
  gulp.task('styles', ['clean'], function () {
    return gulp.src([
      config.appStyleFiles,
      '!' + config.appComponents
    ])
      .pipe($.plumber({errorHandler: function (err) {
        $.notify.onError({
          title: 'Error linting at ' + err.plugin,
          subtitle: ' ', //overrides defaults
          message: err.message.replace(/\u001b\[.*?m/g, ''),
          sound: ' ' //overrides defaults
        })(err);

        this.emit('end');
      }}))
      .pipe($.less())
      .pipe($.autoprefixer())
      .pipe($.if(isProd, $.cssRebaseUrls()))
      .pipe($.if(isProd, $.modifyCssUrls({
        modify: function (url) {
          // determine if url is using http, https, or data protocol
          // cssRebaseUrls rebases these URLs, too, so we need to fix that
          var beginUrl = url.indexOf('http:');
          if (beginUrl < 0) {
            beginUrl = url.indexOf('https:');
          }
          if (beginUrl < 0) {
            beginUrl = url.indexOf('data:');
          }

          if (beginUrl > -1) {
            return url.substring(beginUrl, url.length);
          }

          // prepend all other urls
          return '../' + url;
        }
      })))
      .pipe($.if(isProd, $.concat('app.css')))
      .pipe($.if(isProd, $.cssmin()))
      .pipe($.if(isProd, $.rev()))
      .pipe(gulp.dest(config.buildCss));
  });

  // compile scripts and copy into build directory
  gulp.task('scripts', ['clean', 'analyze', 'markup'], function () {
    var htmlFilter = $.filter('**/*.html', {restore: true})
      , jsFilter = $.filter('**/*.js', {restore: true});

    return gulp.src([
      config.appScriptFiles,
      config.buildDir + '**/*.html',
      '!' + config.appComponents,
      '!**/*_test.*',
      '!**/index.html'
    ])
      .pipe($.sourcemaps.init())
      .pipe($.if(isProd, htmlFilter))
      .pipe($.if(isProd, $.ngHtml2js({
        // lower camel case all app names
        moduleName: _.camelize(_.slugify(_.humanize(require('../package.json').name))),
        declareModule: false
      })))
      .pipe($.if(isProd, htmlFilter.restore))
      .pipe(jsFilter)
      .pipe($.if(isProd, $.angularFilesort()))
      .pipe($.if(isProd, $.concat('app.js')))
      .pipe($.if(isProd, $.ngAnnotate()))
      .pipe($.if(isProd, $.uglify()))
      .pipe($.if(isProd, $.rev()))
      .pipe($.addSrc($.mainBowerFiles({filter: /webcomponents/})))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(config.buildJs))
      .pipe(jsFilter.restore);
  });

  // inject custom CSS and JavaScript into index.html
  gulp.task('inject', ['markup', 'styles', 'scripts'], function () {
    var jsFilter = $.filter('**/*.js', {restore: true});

    return gulp.src(config.buildDir + 'index.html')
      .pipe($.inject(gulp.src([
          config.buildCss + '**/*',
          config.buildJs + '**/*',
          '!**/webcomponents.js'
        ])
        .pipe(jsFilter)
        .pipe($.angularFilesort())
        .pipe(jsFilter.restore), {
          addRootSlash: false,
          ignorePath: config.buildDir
        })
      )
      .pipe($.inject(gulp.src([
          config.buildJs + 'webcomponents.js'
        ]), {
          starttag: '<!-- inject:head:{{ext}} -->',
          endtag: '<!-- endinject -->',
          addRootSlash: false,
          ignorePath: config.buildDir
        })
      )
      .pipe(gulp.dest(config.buildDir));
  });

  // copy bower components into build directory
  gulp.task('bowerCopy', ['inject'], function () {
    var cssFilter = $.filter('**/*.css', {restore: true})
      , jsFilter = $.filter('**/*.js', {restore: true});

    return gulp.src($.mainBowerFiles(), {base: bowerDir})
      .pipe(cssFilter)
      .pipe($.if(isProd, $.modifyCssUrls({
        modify: function (url, filePath) {
          if (url.indexOf('http') !== 0 && url.indexOf('data:') !== 0) {
            filePath = path.dirname(filePath) + path.sep;
            filePath = filePath.substring(filePath.indexOf(bowerDir) + bowerDir.length,
              filePath.length);
          }
          url = path.normalize(filePath + url);
          url = url.replace(/[/\\]/g, '/');
          return url;
        }
      })))
      .pipe($.if(isProd, $.concat('vendor.css')))
      .pipe($.if(isProd, $.cssmin()))
      .pipe($.if(isProd, $.rev()))
      .pipe(gulp.dest(config.extDir))
      .pipe(cssFilter.restore)
      .pipe(jsFilter)
      .pipe($.if(isProd, $.concat('vendor.js')))
      .pipe($.if(isProd, $.uglify({
        preserveComments: $.uglifySaveLicense
      })))
      .pipe($.if(isProd, $.rev()))
      .pipe(gulp.dest(config.extDir))
      .pipe(jsFilter.restore);
  });

  // inject bower components into index.html
  gulp.task('bowerInject', ['bowerCopy'], function () {
    if (isProd) {
      return gulp.src(config.buildDir + 'index.html')
        .pipe($.inject(gulp.src([
          config.extDir + 'vendor*.css',
          config.extDir + 'vendor*.js'
        ], {
          read: false
        }), {
          starttag: '<!-- bower:{{ext}} -->',
          endtag: '<!-- endbower -->',
          addRootSlash: false,
          ignorePath: config.buildDir
        }))
        .pipe($.htmlmin({
          collapseWhitespace: true,
          //removeComments: true
        }))
        .pipe(gulp.dest(config.buildDir));
    } else {
      return gulp.src(config.buildDir + 'index.html')
        .pipe($.wiredep.stream({
          exclude: [/webcomponents/],
          ignorePath: '../../' + bowerDir.replace(/\\/g, '/'),
          fileTypes: {
            html: {
              replace: {
                css: function (filePath) {
                  return '<link rel="stylesheet" href="' + config.extDir.replace(config.buildDir, '') +
                    filePath + '">';
                },
                js: function (filePath) {
                  return '<script src="' + config.extDir.replace(config.buildDir, '') +
                    filePath + '"></script>';
                }
              }
            }
          }
        }))
        .pipe(gulp.dest(config.buildDir));
    }
  });

  // compile components and copy into build directory
  gulp.task('components', ['bowerInject'], function () {
    var polymerBowerAssetsToCopy
      , styleFilter = $.filter('**/*.less', {restore: true});

    // List all Bower component assets that should be copied to the build
    // directory. The Bower directory is automatically prepended via the
    // map function.
    polymerBowerAssetsToCopy = [
      'polymer/polymer*.html',
      'paper-drawer-panel/paper-drawer-panel.html',
      'paper-header-panel/paper-header-panel.html',
      'paper-toolbar/paper-toolbar.html',
      'paper-menu/paper-menu.html',
      'paper-menu/paper-submenu.html',    
      'paper-item/paper-item.html', 
      'paper-icon-button/paper-icon-button.html',
      'iron-icons/iron-icons.html',
      'iron-flex-layout/classess/iron-flex-layout.html',
      'iron-menu-behaviour/iron-menu-behaviour.html',
      'iron-flex-layout/classes/*.html',
      'paper-styles/{color.html,default-theme.html,paper-styles.html,shadow.html,typography.html}',
      'paper-tabs/paper-tabs.html',
      'paper-tabs/paper-tab.html',
      '**/**.html'
    ].map(function (file) {
      return bowerDir + file;
    });

    return gulp.src(config.appComponents)
      .pipe($.addSrc(polymerBowerAssetsToCopy, {base: bowerDir}))
      .pipe($.sourcemaps.init())
      .pipe(styleFilter)
      .pipe($.less())
      .pipe(styleFilter.restore)
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(config.buildComponents));
  });

  // inject components
  gulp.task('componentsInject', ['components'], function () {
    // List all Polymer and custom copmonents that should be injected
    // into index.html. The are injected in the order listed and the
    // components directory is automatically prepended via the
    // map function.
    var polymerAssetsToInject = [
      'polymer/polymer.html',
      'paper-drawer-panel/paper-drawer-panel.html',
      'paper-header-panel/paper-header-panel.html',
      'paper-toolbar/paper-toolbar.html',
      'paper-menu/paper-menu.html',
      'paper-menu/paper-submenu.html',    
      'paper-item/paper-item.html',    
      'paper-icon-button/paper-icon-button.html',
      'iron-icons/iron-icons.html'  ,
      'iron-flex-layout/classes/iron-flex-layout.html',
      'iron-menu-behaviour/iron-menu-behaviour.html',
      'paper-tabs/paper-tabs.html',
      'paper-tabs/paper-tab.html'
    ].map(function (file) {
      return config.buildComponents + file;
    });

    return gulp.src(config.buildDir + 'elements.html')
      .pipe($.inject(gulp.src(polymerAssetsToInject), {
          starttag: '<!-- inject:html -->',
          endtag: '<!-- endinject -->',
          addRootSlash: false,
          ignorePath: config.buildDir
        })
      )
      .pipe(gulp.dest(config.buildDir));
  });

  // import element.html file into index.html file
  gulp.task('htmlimport', ['componentsInject'],function() {
    var htmlFileToImport = [
      'elements.html'
    ].map(function (file) {
      return config.buildDir + file;
    });
    
    return gulp.src(config.buildDir + 'index.html')
      .pipe($.inject(gulp.src(htmlFileToImport), {
        addRootSlash: false,
        ignorePath: config.buildDir
      }))
      .pipe(gulp.dest(config.buildDir));
  });

  // Vulcanize polymer html files
  gulp.task('vulcanize', ['htmlimport'],function() {
    return gulp.src(config.buildDir + 'elements.html')
      .pipe($.vulcanize({
        stripComments: true,
        inlineCss: true,
        inlineScripts: true
      }))
    .pipe(gulp.dest(config.buildDir));
  });
    
  // Delete the commponents folder from build
  gulp.task('deleteComponent', ['vulcanize'],function() {
    return $.del(config.buildComponents);
  });   
  
  // copy Bower fonts and images into build directory
  gulp.task('bowerAssets', ['clean'], function () {
    var assetFilter = $.filter('**/*.{eot,otf,svg,ttf,woff,woff2,gif,jpg,jpeg,png}', {restore: true});
    return gulp.src($.mainBowerFiles(), {base: bowerDir})
      .pipe(assetFilter)
      .pipe(gulp.dest(config.extDir))
      .pipe(assetFilter.restore);
  });

  // copy custom fonts into build directory
  gulp.task('fonts', ['clean'], function () {
    var fontFilter = $.filter('**/*.{eot,otf,svg,ttf,woff,woff2}', {restore: true});
    return gulp.src([config.appFontFiles])
      .pipe(fontFilter)
      .pipe(gulp.dest(config.buildFonts))
      .pipe(fontFilter.restore);
  });

  // copy optional favicon in app directory
  gulp.task('favicon', ['clean'], function () {
    return gulp.src(path.join(config.appDir, 'favicon.ico'))
      .pipe(gulp.dest(config.buildDir));
  });

  // copy and optimize images into build directory
  gulp.task('images', ['clean'], function () {
    return gulp.src(config.appImageFiles)
      .pipe($.if(isProd, $.imagemin()))
      .pipe(gulp.dest(config.buildImages));
  });

  gulp.task('copyTemplates', ['deleteComponent'], function () {
    // always copy templates to testBuild directory
    var stream = $.streamqueue({objectMode: true});

    stream.queue(gulp.src([config.buildDirectiveTemplateFiles]));

    return stream.done()
      .pipe(gulp.dest(config.buildTestDirectiveTemplatesDir));
  });

  gulp.task('deleteTemplates', ['copyTemplates'], function (cb) {
    // only delete templates in production
    // the templates are injected into the app during prod build
    if (!isProd) {
      return cb();
    }

    gulp.src([config.buildDir + '**/*.html'])
      .pipe(gulp.dest('tmp/' + config.buildDir))
      .on('end', function () {
        $.del([
          config.buildDir + '*',
          '!' + config.buildComponents,
          '!' + config.buildCss,
          '!' + config.buildFonts,
          '!' + config.buildImages,
          '!' + config.buildJs,
          '!' + config.extDir,
          '!' + config.buildDir + 'index.html',
          '!' + config.buildDir + 'elements.html'
        ], {mark: true})
          .then(function () {
            cb();
          });
      });
  });

  gulp.task('build', ['deleteTemplates', 'bowerAssets', 'images', 'favicon', 'fonts']);
};
