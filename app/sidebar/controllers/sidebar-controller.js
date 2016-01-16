(function () {
  'use strict';

  /**
   * @ngdoc object
   * @name sidebar.controller:SidebarCtrl
   *
   * @description
   *
   */
  angular
    .module('sidebar')
    .controller('SidebarCtrl', SidebarCtrl);

  function SidebarCtrl() {
    var vm = this;
    vm.ctrlName = 'SidebarCtrl';
  }
}());
