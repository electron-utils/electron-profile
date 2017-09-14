'use strict';

const path = require('path');
const {app, BrowserWindow} = require('electron');
const profile = require('../../../index');
const ipcPlus = require('electron-ipc-plus');

global.Profile = profile;

// =============
// MAIN TESTS
// =============
let gdir = path.join(__dirname, '../global');
let ldir = path.join(__dirname, '../local');

profile.register('global', gdir);
profile.register('local', ldir, 'global');

let gProfile = profile.load('profile://global/user.json');
let lProfile = profile.load('profile://local/user.json');

switch (process.env.TEST) {
  case 'main profile load':
    console.log(gProfile.get('name'));
    console.log(lProfile.get('name'));
    console.log(gProfile.get('info.timestamp'));
    console.log(lProfile.get('info.timestamp'));
    console.log(lProfile.get('a.b.c.d'));
    console.log('END');
    break;
  case 'main profile set':
    lProfile.set('a.b.c.d', 0);
    console.log(gProfile.get('a.b.c.d'));
    console.log(lProfile.get('a.b.c.d'));
    gProfile.set('e', '');
    console.log(gProfile.get('e'));
    console.log(lProfile.get('e'));
    console.log('END');
    break;
  case 'main profile delete':
    lProfile.delete('info.timestamp');
    console.log(lProfile.get('info.timestamp'));
    gProfile.delete('info.timestamp');
    console.log(lProfile.get('info.timestamp'));
    console.log('END');
  case 'main profile save':
    lProfile.set('info.time', '1234567890');
    console.log(lProfile.get('info.time'));
    console.log('END');
    lProfile.save();
    break;
  case 'main profile reload':
    lProfile.set('info.time', '');
    console.log(lProfile.get('info.time'));
    lProfile.reload();
    console.log(lProfile.get('info.time'));
    console.log('END');
    break;
  case 'main profile clear':
    console.log(lProfile.get('name'));
    lProfile.clear();
    console.log(lProfile.get('name'));
    console.log('END');
    break;
  case 'main profile reset':
    console.log(gProfile.get('name'));
    gProfile.reset({
      name: 'VisualSJ'
    });
    console.log(gProfile.get('name'));
    console.log('END');
    break;
};

let win = null;

app.on('ready', function () {
  win = new BrowserWindow({
    center: true,
    width: 400,
    height: 300
  });
  win.loadURL('file://' + __dirname + '/index.html');
});

ipcPlus.on('test-query-profile', (event, type, path) => {
  let user = profile.load(`profile://${type}/user.json`);
  event.reply(null, user.get(path));
});