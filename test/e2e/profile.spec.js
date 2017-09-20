'use strcit';

const path = require('path');
const fsJetpack = require('fs-jetpack');
const electron = require('electron');
const { Application } = require('spectron');
const assert = require('assert');

describe('renderer profile', () => {

  let DIR = {
    GLOBAL: path.join(__dirname, '../fixtures/app-profile/global'),
  };

  let FILE = {
    GLOBAL: path.join(DIR.GLOBAL, 'user.json'),
  };

  let USER = {
    GLOBAL: {
      name: 'VisualSJ',
    },
  };

  let app;

  before(() => {
    fsJetpack.dir(DIR.GLOBAL, { empty: true });
    fsJetpack.write(FILE.GLOBAL, JSON.stringify(USER.GLOBAL));

    app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile')]
    });
    return app.start();
  });

  after(function () {
    fsJetpack.remove(DIR.GLOBAL);
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('The page operation is correct', () => {
    var tasks = [
      app.client.waitUntilTextExists('.load', 'Success'),
      app.client.waitUntilTextExists('.sync', 'Success'),
    ];

    return Promise.all(tasks);
  });

});