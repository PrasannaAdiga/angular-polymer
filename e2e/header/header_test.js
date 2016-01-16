/* global describe, beforeEach, it, browser, expect */
'use strict';

var HeaderPagePo = require('./header.po');

describe('Header page', function () {
  var headerPage;

  beforeEach(function () {
    headerPage = new HeaderPagePo();
    browser.get('/#/header');
  });

  it('should say HeaderCtrl', function () {
    expect(headerPage.heading.getText()).toEqual('header');
    expect(headerPage.text.getText()).toEqual('HeaderCtrl');
  });
});
