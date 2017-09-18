'use strict';

const path = require('path');
const assert = require('assert');
const fsJetpack = require('fs-jetpack');
const profile = require('../../index');

suite(tap, 'Profile inheritance relationship testing', { timeout: 2000 }, (t) => {
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

  fsJetpack.dir(PATH.GLOBAL, { empty: true });
  fsJetpack.dir(PATH.LOCAL, { empty: true });
  fsJetpack.write(PATH.GJSON, JSON.stringify(PROFILE.GLOBAL));
  fsJetpack.write(PATH.LJSON, JSON.stringify(PROFILE.LOCAL));

  profile.register('global', PATH.GLOBAL);
  profile.register('local', PATH.LOCAL, 'global');
  let gProfile = profile.load('profile://global/user.json');
  let lProfile = profile.load('profile://local/user.json');

  t.test('should be ok in load profile', (t) => {
    t.equal(gProfile.get('name'), 'v...');
    t.equal(lProfile.get('name'), 'VisualSJ');
    t.equal(gProfile.get('info.timestamp'), 1505185942887);
    t.equal(lProfile.get('info.timestamp'), 1505185942887);
    t.equal(lProfile.get('a.b.c.d'), null);
    t.end();
  });

  t.test('should be ok in set profile', (t) => {
    lProfile.set('a.b.c.d', 0);
    t.equal(gProfile.get('a.b.c.d'), null);
    t.equal(lProfile.get('a.b.c.d'), 0);
    gProfile.set('e', '');
    t.equal(gProfile.get('e'), '');
    t.equal(lProfile.get('e'), '');
    lProfile.set('e', '1');
    t.equal(gProfile.get('e'), '');
    t.equal(lProfile.get('e'), '1');
    t.end();
  });

  t.test('should be ok in delete profile', (t) => {
    lProfile.delete('e');
    t.equal(lProfile.get('e'), '');
    gProfile.delete('e');
    t.equal(lProfile.get('e'), null);
    t.end();
  });

  t.test('should be ok in reload profile', (t) => {
    lProfile.set('reload.test', true);
    t.equal(lProfile.get('reload.test'), true);
    lProfile.reload();
    t.equal(lProfile.get('reload.test'), null);
    gProfile.reload();
    t.end();
  });

  t.test('should be ok in save profile', (t) => {
    lProfile.set('info.time', '1234567890');
    t.equal(lProfile.get('info.time'), '1234567890');
    lProfile.save();
    let string = fsJetpack.read(PATH.LJSON);
    let json = JSON.parse(string);
    t.equal(json.info.time, '1234567890');
    t.end();
  });

  t.test('should be ok in clear profile', (t) => {
    t.equal(lProfile.get('name'), 'VisualSJ');
    lProfile.clear();
    t.equal(lProfile.get('name'), 'v...');
    lProfile.reload();
    t.end();
  });

  t.test('should be ok in reset profile', (t) => {
    t.equal(gProfile.get('name'), 'v...');
    gProfile.reset({ name: 'VisualSJ' });
    t.equal(gProfile.get('name'), 'VisualSJ');
    t.end();
  });

  fsJetpack.remove(PATH.GLOBAL);
  fsJetpack.remove(PATH.LOCAL);

});