'use strict';

const {ipcMain} = require('electron');
const Fs = require('fs');
const Events = require('events');
const Protocols = require('electron-protocols');

const Type = require('./type');
const Profile = require('./profile');
const Utils = require('../utils');

const Event = new Events.EventEmitter();

// register profile://
Protocols.register('profile', (uri) => {
    var base = _type2path[uri.hostname];
    if (!base) {
        return null;
    }

    if (uri.pathname) {
        return path.join(base, uri.pathname);
    }

    return base;
});

// ==========================
// Exports
// ==========================

exports.register = function (type, path) {
    Type.register(type, path);
};

exports.reset = function () {
    Type.clear();
};

exports.getPath = function (type) {
    var typeObj = Type.query(type);
    if (!typeObj) {
        return '';
    }
    return typeObj.path;
};

exports.load = function (url, defaultProfile) {
    var uri = Utils.parseUrl(url);
    exports.setDefault(uri.id, defaultProfile);

    return Profile.load(url);
};

exports.setDefault = function (id, defaultProfile) {
    if (!defaultProfile) return;
    Profile.setDefault(id, defaultProfile);
};

Profile.on('profile-changed', (info, data) => {
    ipcPlus.sendToWins('electron-profile:changed', info, data);
});

// ==========================
// Ipc
// ==========================

ipcMain.on('electron-profile:load', (event, url) => {

    event.reply(null, {});
});

ipcMain.on('electron-profile:save', (event, url, data) => {
    let pobj = Profile.load(url);
    if (pobj) {
        pobj.reset(data);
        pobj.save();
    }
});
