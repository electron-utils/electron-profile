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

  it('should be ok in load profile (main)', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'main profile load' }
    });

    return app.start().then(function () {
      return app.client.getMainProcessLogs();
    }).then(function (logs) {
      assert.equal(logs[0], 'v...');
      assert.equal(logs[1], 'VisualSJ');
      assert.equal(logs[2], '1505185942887');
      assert.equal(logs[3], '1505185942887');
      assert.equal(logs[4], 'null');
      assert.equal(logs[5], 'END');
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });
  });

  it('should be ok in set profile (main)', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'main profile set' }
    });

    return app.start().then(function () {
      return app.client.getMainProcessLogs();
    }).then(function (logs) {
      assert.equal(logs[0], 'null');
      assert.equal(logs[1], '0');
      assert.equal(logs[2], '');
      assert.equal(logs[3], '');
      assert.equal(logs[4], 'END');
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });
  });

  it('should be ok in delete profile (main)', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'main profile delete' }
    });

    return app.start().then(function () {
      return app.client.getMainProcessLogs();
    }).then(function (logs) {
      assert.equal(logs[0], '1505185942887');
      assert.equal(logs[1], 'null');
      assert.equal(logs[2], 'END');
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });
  });

  it('should be ok in save profile (main)', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'main profile save' }
    });

    return app.start().then(function () {
      return app.client.getMainProcessLogs();
    }).then(function (logs) {
      assert.equal(logs[0], '1234567890');
      assert.equal(logs[1], 'END');
      let string = fsJetpack.read(PATH.LJSON);
      let json = JSON.parse(string);
      assert.equal(json.info.time, '1234567890');
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });
  });

  it('should be ok in reload profile (main)', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'main profile reload' }
    });

    return app.start().then(function () {
      return app.client.getMainProcessLogs();
    }).then(function (logs) {
      assert.equal(logs[0], '');
      assert.equal(logs[1], '1234567890');
      assert.equal(logs[2], 'END');
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });
  });

  it('should be ok in clear profile (main)', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'main profile clear' }
    });

    return app.start().then(function () {
      return app.client.getMainProcessLogs();
    }).then(function (logs) {
      assert.equal(logs[0], 'VisualSJ');
      assert.equal(logs[1], 'v...');
      assert.equal(logs[2], 'END');
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });
  });

  it('should be ok in reset profile (main)', () => {
    let app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')],
      env: { TEST: 'main profile reset' }
    });

    return app.start().then(function () {
      return app.client.getMainProcessLogs();
    }).then(function (logs) {
      assert.equal(logs[0], 'v...');
      assert.equal(logs[1], 'VisualSJ');
      assert.equal(logs[2], 'END');
    }).then(function () {
      return app.stop();
    }).catch(function (error) {
      return app.stop().then(() => {
        return Promise.reject(error);
      });
    });
  });

  it('should be ok in page (renderer)', () => {
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