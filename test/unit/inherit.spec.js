'use strict';

const path = require('path');
const fsJetpack = require('fs-jetpack');
const profile = require('../../index');

suite(tap, 'profile inherit', { timeout: 2000 }, t => {
  let global = path.join(__dirname, '../fixtures/global');
  let local = path.join(__dirname, '../fixtures/local');
  fsJetpack.dir(global);
  fsJetpack.dir(local);

  profile.register('global', global);
  profile.register('local', local);

  profile.inherit('local', 'global');

  let globalJson = {
    foo: 'foo',
    bar: 'bar'
  };
  let localJson = {
    bar: ''
  };

  let globalJsonPath = path.join(global, 'inherit.json');
  let localJsonPath = path.join(local, 'inherit.json');
  fsJetpack.write(globalJsonPath, globalJson);
  fsJetpack.write(localJsonPath, localJson);

  let globalProfile = profile.load('profile://global/inherit.json');
  let localProfile = profile.load('profile://local/inherit.json');

  let globalSchema = {
      'foo': '',
      'bar': '',
      'boolean': true,
  };
  let localSchema = {
      'foo': 0,
      'bar': 0,
  };
  profile.registerSchema('profile://global/inherit.json', globalSchema);
  profile.registerSchema('profile://local/inherit.json', localSchema);

  t.test('profile inherit', (t) => {
    t.equal(globalProfile.get('foo'), globalJson['foo']);
    t.equal(globalProfile.get('bar'), globalJson['bar']);
    t.equal(localProfile.get('foo'), globalJson['foo']);
    t.equal(localProfile.get('bar'), localJson['bar']);
    t.end();
  });

  t.test('profile inherit and schema', (t) => {

    localProfile.set('foo', 2);
    t.equal(globalProfile.get('foo'), globalJson['foo']);
    t.equal(localProfile.get('foo'), globalJson['foo']);

    globalProfile.set('foo', 'abc');
    t.equal(globalProfile.get('foo'), 'abc');
    t.equal(localProfile.get('foo'), 'abc');

    t.end();
  });

  fsJetpack.remove(global);
  fsJetpack.remove(local);
});