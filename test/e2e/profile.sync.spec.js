'use strict';

const path = require('path');
const electron = require('electron');
const { Application } = require('spectron');

describe('profile - sync', function () {
  this.timeout(0);

  let app;
  before(() => {
    app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'fixtures', 'app-profile-sync')],
    });
    return app.start();
  });

  after(() => {
    return app.stop();
  });

  it('Inter-page data transfer', () => {
    return app.client.waitUntilTextExists('.label', 'Success')
  });
});