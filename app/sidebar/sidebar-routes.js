(function () {
  'use strict';

  angular
    .module('sidebar')
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('sidebar', {
        abstract: true,
        parent: 'header',
        views: {
          'sidebar@': {
            templateUrl: 'sidebar/views/sidebar.tpl.html',
            controller: 'SidebarCtrl',
            controllerAs: 'sidebar'
          }
        }
      });
  }
}());
