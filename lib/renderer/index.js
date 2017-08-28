'use strict';

const IpcPlus = require('electron-ipc-plus');
const EventEmitter = require('events');

const Type = require('./type');
const Profile = require('./profile');

exports.load = function (url, callback) {
  Profile.load(url, callback);
};

IpcPlus.sendToMain('electron-profile:query-type-list', (error, list) => {
    if (error) {
        console.warn(error);
        list = [];
    }
    Type.updateList(list, false);
});

IpcPlus.on('electron-profile:type-list-changed', (events, list) => {
    Type.updateList(list, true);
});