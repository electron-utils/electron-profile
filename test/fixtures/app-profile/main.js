'use strict';

const path = require('path');
const {app, BrowserWindow} = require('electron');
const type = require('../../../lib/share/type');
const profile = require('../../../lib/share/profile');


// =============
// MAIN TESTS
// =============
(() => {
  let gdir = path.join(__dirname, '../global');
  let ldir = path.join(__dirname, '../local');

  type.add('global', gdir, 'null');
  type.add('local', ldir, 'global');

  let item = profile.load('user', 'local', {test: true});
  console.log('load success'); // 0
  console.log(item.get('name')); // 1
  console.log(item.get('a.b.c')); // 2
  console.log(item.get('info.timestamp')); // 3
  console.log(item.get('test')); // 4

  item.set('a.b.c', true);
  item.set('test', false);
  console.log(item.get('a.b.c')); // 5
  console.log(item.get('test')); // 6
  item.save();

  item.delete('a.b.c');
  console.log(item.get('a.b.c')); // 7
  item.delete('a');
  console.log(item.get('a')); // 8
  item.reload();
  console.log(item.get('a.b.c')); // 9
  item.clear();
  console.log(item.get('test')); // 10
  item.reload();
  item.reset({a: 1});
  console.log(item.get('test')); // 11
  console.log(item.get('a')); // 12
})();

let win = null;

app.on('ready', function () {
  win = new BrowserWindow({
    center: true,
    width: 400,
    height: 300
  });
  win.loadURL('file://' + __dirname + '/index.html');
});
