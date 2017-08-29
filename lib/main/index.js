'use strict';

const IpcPlus = require('electron-ipc-plus');
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

// ==========================
// Type Message and Events
// ==========================

Type.on('register', (type, list) => {
    IpcPlus.sendToWins('electron-profile:types-changed', list);
});

IpcPlus.on('electron-profile:query-types', (event, test) => {
    event.reply(null, Type.getList());
});

// ==========================
// Profile Message and Events
// ==========================

Profile.on('destroy', (id) => {
    IpcPlus.sendToWins('electron-profile:profile-destroy', id);
});

// core 层修改了数据，通知 page 层更新
Profile.on('profile-changed', (data) => {
    IpcPlus.sendToWins('electron-profile:profile-changed', data);
});

// page 层请求数据
IpcPlus.on('electron-profile:load', (event, url, defaultProfile) => {
    var info = Utils.parseUrl(url);

    if (!Profile.source_cache[info.id]) {
        Profile.init(info.id);
    }

    // default value
    if (defaultProfile) {
        Profile.setDefault(info.id, defaultProfile);
    }

    event.reply(null, {
        id: info.id,
        default: Profile.default_cache[info.id] || null,
        type: info.type,
        source: Profile.source_cache[info.id] || null,
    });
});

// 页面修改了 profile，通知 core 层更新数据
IpcPlus.on('electron-profile:profile-changed', (event, data) => {
    Profile.updateProfile(data, true);
});