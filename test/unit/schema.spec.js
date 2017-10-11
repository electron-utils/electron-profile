'use strict';

const path = require('path');
const fsJetpack = require('fs-jetpack');
const profile = require('../../index');

suite(tap, 'profile schema', { timeout: 2000 }, t => {
  let dir = path.join(__dirname, '../fixtures/profiles');
  let jsonPath = path.join(dir, 'type.json');

  fsJetpack.dir(dir);

  let json = {
    'default': 'foo',
  };

  fsJetpack.write(jsonPath, json);
  let type = profile.load('profile://fixtures/profiles/type.json');

  let schema = {
      'default': 'bar',
      'string': 'string',
      'number': 0,
      'boolean': true
  };
  profile.registerSchema('profile://fixtures/profiles/type.json', schema);

  t.test('profile.get', (t) => {
    t.equal(type.get('default'), json['default']);
    t.equal(type.get('string'), schema['string']);
    t.equal(type.get('number'), schema['number']);
    t.equal(type.get('boolean'), schema['boolean']);
    t.end();
  });

  t.test('profile.set', (t) => {
    type.set('string', 0);
    t.equal(type.get('string'), schema['string']);
    type.set('string', 'foo');
    t.equal(type.get('string'), 'foo');
    type.set('unknown', 'unknown');
    t.equal(type.get('unknown'), undefined);
    t.end();
  });

  t.test('profile.remove', (t) => {
    type.remove('string');
    t.equal(type.get('string'), schema['string']);
    t.end();
  });

  fsJetpack.remove(dir);
});