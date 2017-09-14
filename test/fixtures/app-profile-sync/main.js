'use strict';

const profile = require('../../../index');
const {app, BrowserWindow} = require('electron');

profile.register('local', __dirname);

app.on('ready', function () {
  let win1 = new BrowserWindow({
    x: 200,
    y: 300,
    width: 400,
    height: 300
  });
  win1.loadURL('file://' + __dirname + '/index.html');

  let win2 = new BrowserWindow({
    x: 660,
    y: 300,
    width: 400,
    height: 300
  });
  win2.loadURL('file://' + __dirname + '/index.html');

  setTimeout(() => {
    win1.webContents.send('change-profile');
  }, 700);
});
