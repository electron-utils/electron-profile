'use strict';

const fs = require('fs');
const fsJetpack = require('fs-jetpack');
const profile = require('../../index');

suite(tap, 'profile.load', {timeout: 2000}, t => {
  fsJetpack.dir(`${__dirname}/../fixtures/profiles`);

  t.test('simple profile', t => {
    fsJetpack.write(
      `${__dirname}/../fixtures/profiles/user.json`,
      {
        name: 'johnny',
        email: 'johnny@electron-utils.com',
      }
    );

    let info = profile.load('profile://fixtures/profiles/user.json'/*, {
      name: 'jwu',
      email: 'jwu@e.com'
    }*/);

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    t.end();
  });

  t.test('profile has less field than default', t => {
    fsJetpack.write(
      `${__dirname}/../fixtures/profiles/user-01.json`,
      {
        name: 'johnny',
        email: 'johnny@electron-utils.com',
      }
    );

    let info = profile.load('profile://fixtures/profiles/user-01.json'/*, {
      name: 'jwu',
      email: 'jwu@e.com',
      description: 'I\'m jwu',
    }*/);

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    // t.equal(info.get('description'), 'I\'m jwu');
    t.equal(info.get('description'), undefined);
    t.end();
  });

  t.test('profile has more fields than default', t => {
    fsJetpack.write(
      `${__dirname}/../fixtures/profiles/user-02.json`,
      {
        name: 'johnny',
        email: 'johnny@electron-utils.com',
        description: 'I\'m johnny',
      }
    );

    let info = profile.load('profile://fixtures/profiles/user-02.json'/*, {
      name: 'jwu',
      email: 'jwu@e.com',
    }*/);

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    // t.equal(info.get('description'), null);
    t.equal(info.get('description'), 'I\'m johnny');
    t.end();
  });

  t.test('profile has different type than default in the same field', t => {
    fsJetpack.write(
      `${__dirname}/../fixtures/profiles/user-03.json`,
      {
        name: 'johnny',
        email: 'johnny@electron-utils.com',
        extra: false,
      }
    );

    let info = profile.load('profile://fixtures/profiles/user-03.json'/*, {
      name: 'jwu',
      email: 'jwu@e.com',
      extra: 'foo',
    }*/);

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    // t.equal(info.get('extra'), 'foo');
    t.equal(info.get('extra'), false);
    t.end();
  });
});
