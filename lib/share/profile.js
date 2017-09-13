'use strict';

const fs = require('fs');
const path = require('path');
const protocols = require('electron-protocols');
const platform = require('electron-platform');
const ipcPlus = require('electron-ipc-plus');
const typeManager = require('./type');

const utils = require('./utils');

utils.findCache = function (id, type) {
  let idCache = cache[id];
  if (!idCache) {
    return null;
  }
  return idCache[type] || null;
};

// ======================
// Internal
// ======================

const cache = {
  // id: { type: Object }
};
const default_cache = {
  // id: { type: Object }
};

class Profile {

  constructor(id, type, defaultProfile) {
    this.id = id;
    this.type = type;
    this.defaultProfile = defaultProfile || {};

    this._data = {};
  }

  get(path) {
    path += '';
    if (!utils.checkPath(path)) {
      console.log(`Path illegal: ${path}`);
      return null;
    }
    let paths = path.split('.');
    let values = [];
    let type = typeManager.findOfName(this.type);

    // The parameters are being modified
    values.push(this._data);
    //Profile parameters
    values.push(utils.findCache(this.id, type.name));
    // Inheritance chain parameters
    type.eachInherit((item) => {
      values.push(utils.findCache(this.id, item.name));
    });
    // Private default parameter
    values.push(this.defaultProfile);
    // Common default parameter
    if (default_cache[this.id] && default_cache[this.id][type.name]) {
      values.push(default_cache[this.id][type.name]);
    }

    return utils.searchObject(values, paths);
  }

  set(path, value) {
    path += '';
    if (!utils.checkPath(path)) {
      console.log(`Path illegal: ${path}`);
      return null;
    }
    let paths = path.split('.');
    utils.setObject(this._data, paths, value);
    return value;
  }

  delete(path) {
    this.set(path, undefined);
  }

  save() {
    let data = cache[this.id][this.type];

    // this._data -> data
    utils.transferObject(data, this._data);

    Object.keys(this._data).forEach((key) => {
      delete this._data[key];
    });

    let url = `profile://${this.type}/${this.id}.json`;
    let path = protocols.path(url);
    fs.writeFileSync(path, JSON.stringify(data));

    ipcPlus.sendToAll('electron-profile:profile-save', this.id, this.type);

    return data;
  }

  reload() {
    _load(this.id, this.type);
    Object.keys(this._data).forEach((key) => {
      delete this._data[key];
    });
  }

  clear() {
    let data = cache[this.id][this.type];
    Object.keys(data).forEach((key) => {
      this.set(key, undefined);
    });
  }

  reset(profile) {
    Object.keys(this._data).forEach((key) => {
      delete this._data[key];
    });
    utils.transferObject(this._data, profile);
  }

};

/**
 * @method _load
 * @param {*} id 
 * @param {*} type 
 * @param {Boolean} deep
 */
let _load = function (id, type, deep) {
  type = typeManager.findOfName(type);

  cache[id] = cache[id] || {};

  function loadJson(name, id) {
    let url = `profile://${name}/${id}.json`;
    let path = protocols.path(url);
    let value = null;
    if (fs.existsSync(path)) {
      try {
        let string = fs.readFileSync(path, 'utf-8');
        value = JSON.parse(string);
      } catch (error) {
        console.log(error);
        value = {};
      };
    } else {
      value = {};
    }
    cache[id][name] = value;
  };

  loadJson(type.name, id);
  if (deep !== false) {
    type.eachInherit((type) => {
      loadJson(type.name, id, deep);
    });
  }
};

// =================
// 
// =================

/**
 * @method load
 * @param {*} id 
 * @param {*} type 
 * @param {*} defaultProfile 
 */
let load = function (id, type, defaultProfile) {
  let profile = new Profile(id, type, defaultProfile);
  _load(id, type);
  return profile;
};

/**
 * @method setDefault
 * @param {*} id 
 * @param {*} type 
 * @param {*} defaultProfile 
 */
let setDefault = function (id, type, defaultProfile) {
  if (!default_cache[id]) {
    default_cache[id] = {};
  }
  default_cache[id][type] = defaultProfile;
  if (platform.isMainProcess) {
    ipcPlus.sendToWins('electron-profile:profile-default-add', id, type, defaultProfile);
  }
};

exports.load = load;
exports.setDefault = setDefault;

// =================
// Protocol
// =================

if (platform.isMainProcess) {
  // register profile://
  protocols.register('profile', uri => {
    let typeItem = typeManager.findOfName(uri.hostname);
    if (!typeItem) {
      return null;
    }
    let base = typeItem.path;
    if (!base) {
      return null;
    }

    if (uri.pathname) {
      return path.join(base, uri.pathname);
    }

    return base;
  });
}

// =================
// IPC Event
// =================

if (platform.isMainProcess) {

  ipcPlus.on('electron-profile:profile-default-init', (event) => {
    event.returnValue = default_cache;
  });

} else {

  let data = ipcPlus.sendToMainSync('electron-profile:profile-default-init');
  Object.keys(data).forEach((key) => {
    default_cache[key] = data[key];
  });

  ipcPlus.on('electron-profile:profile-default-add', (event, id, type, profile) => {
    setDefault(id, type, profile);
  });

}

ipcPlus.on('electron-profile:profile-save', (id, type) => {
  if (cache[id] && cache[id][type]) {
    _load(id, type);
  }
});