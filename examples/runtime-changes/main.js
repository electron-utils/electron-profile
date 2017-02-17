'use strict';

const {app, BrowserWindow} = require('electron');
const profile = require('../../index');

let win, win2;

app.on('ready', function () {
  win = new BrowserWindow({
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  });
  win.loadURL('file://' + __dirname + '/index.html');

  win2 = new BrowserWindow({
    x: 510,
    y: 100,
    width: 400,
    height: 300,
  });
  win2.loadURL('file://' + __dirname + '/index-02.html');

  let info = profile.load('profile://global/user.json', {
    name: 'Johnny Wu',
    email: 'johnny.wu@electron-utils.com',
  });

  console.log(info.data.name);
  console.log(info.data.email);
});
