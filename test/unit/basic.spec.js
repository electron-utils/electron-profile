'use strict';

const fs = require('fs');
const fsJetpack = require('fs-jetpack');
const profile = require('../../index');

suite(tap, 'profile.load', {timeout: 2000}, t => {
  fsJetpack.dir(`${__dirname}/../fixtures/profiles`, {empty: true});

  t.test('simple profile', t => {
    fs.writeFileSync(
      `${__dirname}/../fixtures/profiles/user.json`,
      JSON.stringify({
        name: 'johnny',
        email: 'johnny@electron-utils.com',
      }, null, 2)
    );

    let info = profile.load('profile://fixtures/profiles/user.json', {
      name: 'jwu',
      email: 'jwu@e.com'
    });

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    t.end();
  });

  t.test('profile has less field than default', t => {
    fs.writeFileSync(
      `${__dirname}/../fixtures/profiles/user-01.json`,
      JSON.stringify({
        name: 'johnny',
        email: 'johnny@electron-utils.com',
      }, null, 2)
    );

    let info = profile.load('profile://fixtures/profiles/user-01.json', {
      name: 'jwu',
      email: 'jwu@e.com',
      description: 'I\'m jwu',
    });

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    t.equal(info.get('description'), 'I\'m jwu');
    t.end();
  });

  t.test('profile has more fields than default', t => {
    fs.writeFileSync(
      `${__dirname}/../fixtures/profiles/user-02.json`,
      JSON.stringify({
        name: 'johnny',
        email: 'johnny@electron-utils.com',
        description: 'I\'m johnny',
      }, null, 2)
    );

    let info = profile.load('profile://fixtures/profiles/user-02.json', {
      name: 'jwu',
      email: 'jwu@e.com',
    });

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    t.equal(info.get('description'), null);
    t.end();
  });

  t.test('profile has different type than default in the same field', t => {
    fs.writeFileSync(
      `${__dirname}/../fixtures/profiles/user-03.json`,
      JSON.stringify({
        name: 'johnny',
        email: 'johnny@electron-utils.com',
        extra: false,
      }, null, 2)
    );

    let info = profile.load('profile://fixtures/profiles/user-03.json', {
      name: 'jwu',
      email: 'jwu@e.com',
      extra: 'foo',
    });

    t.equal(info.get('name'), 'johnny');
    t.equal(info.get('email'), 'johnny@electron-utils.com');
    t.equal(info.get('extra'), 'foo');
    t.end();
  });
});
