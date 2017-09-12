'use strict';

const path = require('path');
const {app, BrowserWindow} = require('electron');
const profile = require('../../../index');
const ipcPlus = require('electron-ipc-plus');

global.Profile = profile;

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