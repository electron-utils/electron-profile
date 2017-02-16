'use strict';

const {app, BrowserWindow} = require('electron');
const profile = require('../../index');

let win;

app.on('ready', function () {
  win = new BrowserWindow({
    center: true,
    width: 400,
    height: 300,
  });
  win.loadURL('file://' + __dirname + '/index.html');

  let info = profile.load('profile://global/user.json', {
    name: 'Johnny Wu',
    email: 'johnny.wu@electron-utils.com',
  });

  console.log(info.data.name);
  console.log(info.data.email);
});
