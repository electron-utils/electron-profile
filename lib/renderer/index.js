'use strict';

const IpcPlus = require('electron-ipc-plus');
const EventEmitter = require('events');

const Type = require('./type');
const Profile = require('./profile');

exports.load = function (url, callback) {
  Profile.load(url, callback);
};

// IPC bug，在 core 层密集运算的时候，会丢失消息，暂未找到原因
IpcPlus.sendToMain('electron-profile:query-types', 'test', (error, list) => {
    if (error) {
        console.warn(error);
        list = [];
    }
    Type.updateList(list, false);
});
setTimeout(() => {
    IpcPlus.sendToMain('electron-profile:query-types', 'test', (error, list) => {
        if (error) {
            console.warn(error);
            list = [];
        }
        Type.updateList(list, false);
    });
}, 0);

IpcPlus.on('electron-profile:types-changed', (event, list) => {
    Type.updateList(list, true);
});