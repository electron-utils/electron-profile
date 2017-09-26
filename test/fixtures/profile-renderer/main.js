'use strict';

const path = require('path');
const {app, BrowserWindow} = require('electron');
const profile = require('../../../index');
const ipcPlus = require('electron-ipc-plus');

profile.register('global', path.join(__dirname, './global'));

let win = null;

app.on('ready', function () {
  win = new BrowserWindow({
    center: true,
    width: 400,
    height: 300
  });
  win.loadURL('file://' + __dirname + '/index.html');
});

ipcPlus.on('change-profile-in-main-process', (event, url, key, value) => {
  let item = profile.load(url);
  item.set(key, value);
  item.save();
});