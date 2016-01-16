(function () {
  'use strict';

  angular
    .module('home')
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        parent: 'sidebar',
        views: {
          '@': {
            templateUrl: 'home/views/home.tpl.html',
            controller: 'HomeCtrl',
            controllerAs: 'home'
          }
        }
      });
  }
}());
