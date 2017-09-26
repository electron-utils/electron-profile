'use strict';

const path = require('path');
const fsJetpack = require('fs-jetpack');
const profile = require('../../index');

suite(tap, 'profile operation', { timeout: 2000 }, t => {
  let dir = path.join(__dirname, '../fixtures/profiles');
  let jsonPath = path.join(dir, 'email.json');

  fsJetpack.dir(dir);

  let json = {
    email: 'v@electron-utils.com',
    info: {
      foo: 'bar',
    }
  };

  fsJetpack.write(jsonPath, json);
  let email = profile.load('profile://fixtures/profiles/email.json');

  t.test('profile.get', (t) => {
    t.equal(email.get('email'), json.email);    
    t.equal(email.get('info.foo'), json.info.foo);
    t.equal(email.get('info.a.b.c'), null);
    t.end();
  });

  t.test('profile.set', (t) => {
    let _email = 'Visualsj@electron-utils.com';
    let _bar = 'otherBar';
    email.set('email', _email);
    t.equal(email.get('email'), _email);
    email.set('info.foo', _bar);
    t.equal(email.get('info.foo'), _bar);
    email.set('a.b.c', '');
    t.equal(email.get('a.b.c'), '');
    t.end();
  });

  t.test('profile.delete', (t) => {
    email.delete('info.foo');
    t.equal(email.get('info.foo'), null);
    email.delete('info');
    t.equal(email.get('info'), null);
    t.equal(email.get('info.foo'), null);
    email.delete('a');
    t.equal(email.get('a.b.c.d'), null);
    t.end();
  });

  fsJetpack.remove(dir);
});