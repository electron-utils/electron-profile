'use strict';

const path = require('path');
const electron = require('electron');
const assert = require('assert');
const fsJetpack = require('fs-jetpack');
const { Application } = require('spectron');

describe('profile', function () {

  const PATH = {
    GLOBAL: path.join(__dirname, '../fixtures/global'),
    LOCAL: path.join(__dirname, '../fixtures/local'),
    GJSON: path.join(__dirname, '../fixtures/global/user.json'),
    LJSON: path.join(__dirname, '../fixtures/local/user.json'),
  };

  const PROFILE = {
    GLOBAL: {
      name: 'v...',
      info: { timestamp: 1505185942887 },
      page: {
        foo: true,
        bar: true,
      },
    },
    LOCAL: {
      name: 'VisualSJ',
      page: {
        bar: false,
      }
    },
  };

  this.timeout(0);

  before(function () {
    fsJetpack.dir(PATH.GLOBAL, { empty: true });
    fsJetpack.dir(PATH.LOCAL, { empty: true });
    fsJetpack.write(PATH.GJSON, JSON.stringify(PROFILE.GLOBAL));
    fsJetpack.write(PATH.LJSON, JSON.stringify(PROFILE.LOCAL));
  });

  after(function () {
    fsJetpack.remove(PATH.GLOBAL);
    fsJetpack.remove(PATH.LOCAL);
  });

  it('should be ok in page', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'page' }
    });

    return app.start().then(function () {
      return Promise.all([
        function () {
          return app.client.waitUntilTextExists('.get', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.get-sync', 'Skip');
        },
        function () {
          return app.client.waitUntilTextExists('.set', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.set-sync', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.delete', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.delete-sync', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.save', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.save-sync', 'Skip');
        },
        function () {
          return app.client.waitUntilTextExists('.clear', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.clear-sync', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.reset', 'Success');
        },
        function () {
          return app.client.waitUntilTextExists('.reset-sync', 'Success');
        },
      ]);
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });;
  });
});