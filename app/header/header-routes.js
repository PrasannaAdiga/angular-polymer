(function () {
  'use strict';

  angular
    .module('header')
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('header', {
        abstract: true,
        views: {
          'header@': {
            templateUrl: 'header/views/header.tpl.html',
            controller: 'HeaderCtrl',
            controllerAs: 'header'
          }
        }
      });
  }
}());
