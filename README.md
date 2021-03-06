# Angular-Polymer

![Alt text](/Angular-Polymer.png?raw=true "Angular-Polymer")

A basic starter application to use both angular(1.4) and polymer(1.0) together.
Generated with [ng-poly](https://github.com/dustinspecker/generator-ng-poly/tree/v0.11.4) version 0.11.4.
Added extra features along with the generator-ng-poly:
- Many polymer's built in html elements support
- Vulcanize support to concatenate a set of polymer's Components into one file 

## Setup
1. Install [Node.js](http://nodejs.org/)
 - This will also install npm.
1. Run `npm install -g bower gulp yo generator-ng-poly@0.11.4`
 - This enables Bower, Gulp, and Yeoman generators to be used from command line.
1. Run `npm install` to install this project's dependencies
1. Run `bower install` to install client-side dependencies
1. Use [generator-ng-poly](https://github.com/dustinspecker/generator-ng-poly) to create additional components

## Gulp tasks
- Run `gulp build` to compile assets
- Run `gulp dev` to run the build task and setup the development environment
- Run `gulp unitTest` to run unit tests via Karma and to create code coverage reports
- Run `gulp webdriverUpdate` to download Selenium server standalone and Chrome driver for e2e testing
- Run `gulp e2eTest` to run e2e tests via Protractor
 - **A localhost must be running** - `gulp dev`
 
## Following polymer elements are added using bower
- bower install --save PolymerElements/paper-header-panel
- bower install --save PolymerElements/paper-toolbar
- bower install --save PolymerElements/paper-menu
- bower install --save PolymerElements/paper-item
- bower install --save PolymerElements/paper-drawer-panel
- bower install --save PolymerElements/paper-icon-button
- bower install --save PolymerElements/paper-tabs
- bower install --save PolymerElements/iron-icons
- bower install --save PolymerElements/iron-flex-layout
 
## Vulcanize support for the polymer
- npm install --save gulp-vulcanize