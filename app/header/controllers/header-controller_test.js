/* global describe, beforeEach, it, expect, inject, module */
'use strict';

describe('HeaderCtrl', function () {
  var ctrl;

  beforeEach(module('header'));

  beforeEach(inject(function ($rootScope, $controller) {
    ctrl = $controller('HeaderCtrl');
  }));

  it('should have ctrlName as HeaderCtrl', function () {
    expect(ctrl.ctrlName).toEqual('HeaderCtrl');
  });
});
