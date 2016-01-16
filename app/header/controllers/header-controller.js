(function () {
  'use strict';

  /**
   * @ngdoc object
   * @name header.controller:HeaderCtrl
   *
   * @description
   *
   */
  angular
    .module('header')
    .controller('HeaderCtrl', HeaderCtrl);

  function HeaderCtrl() {
    var vm = this;
    vm.ctrlName = 'HeaderCtrl';
  }
}());
