'use strict';

const platform = require('electron-platform');
const ipcPlus = require('electron-ipc-plus');

const cache = {};

class Type {

    constructor (name, path, inherit) {
        this.name = name;
        this.path = path;
        this.inherit = inherit;
    }

    eachInherit (handler) {
        if (!this.inherit) {
            return false;
        }
        let type = exports.findOfName(this.inherit);
        while (type) {
            handler(type);
            type = exports.findOfName(type.inherit);
        }
    }
};

/**
 * @method add
 * @param {String} name 
 * @param {String} path 
 * @param {String} inherit 
 */
let add = function (name, path, inherit) {
    if (!name || !path) {
        return null;
    }
    let type = new Type(name, path, inherit);
    cache[name] = type;
    if (platform.isMainProcess) {
        ipcPlus.sendToWins('electron-profile:type-add', name, path, inherit);
    }
    return type;
};

/**
 * @method findOfName
 * @param {String} name 
 * @return {Type}
 */
let findOfName = function (name) {
    let type = cache[name];
    if (!type) {
        return null;
    }
    return type;
};

/**
 * @method clear
 */
let clear = function () {
    Object.keys(cache).forEach((key) => {
        delete cache[key];
    });
    if (platform.isMainProcess) {
        ipcPlus.sendToWins('electron-profile:type-clear');
    }
};

exports.add = add;
exports.findOfName = findOfName;
exports.clear = clear;

// ===================

if (platform.isMainProcess) {

    ipcPlus.on('electron-profile:type-init', (event) => {
        event.returnValue = cache;
    });

} else {

    let data = ipcPlus.sendToMainSync('electron-profile:type-init');
    Object.keys(data).forEach((key) => {
        let item = data[key];
        cache[key] = new Type(item.name, item.path, item.inherit);
    });

    ipcPlus.on('electron-profile:type-add', (event, name, path, inherit) => {
        add(name, path, inherit);
    });

    ipcPlus.on('electron-profile:type-clear', (event) => {
        clear();
    });

}