'use strict';

// requires
const { ipcRenderer } = require('electron');
const ipcPlus = require('electron-ipc-plus');
const EventEmitter = require('events');

const utils = require('../share/utils');


// ===================
// Cache
// ===================

// Profile type cache { name: { path: String, inherit: String } }
const _type = {};
// Profile data cache { id: { type: Object } }
const _data = {};
// Profile data cache { id: { type: Default } }
const _default = {};
// Profile object cache
const _url2profile = {};


// ==========================
// exports
// ==========================

/**
 * @module profile
 */
let profile = {};
module.exports = profile;

/**
 * @method load
 * @param {string} url - The url of the profile.
 * @param {object} defaultProfile - 
 *
 * Load profile.
 */
profile.load = function (url, defaultProfile) {
  if (_url2profile[url]) {
    return _url2profile[url];
  }

  if ( url.indexOf('profile://') !== 0 ) {
    console.error(`Failed to load profile ${url}: invalid protocol.`);
    return;
  }

  let urlobj = utils.u2o(url);

  _load(urlobj.id, urlobj.type);

  let profileInst = new Profile(urlobj.id, urlobj.type);
  _url2profile[url] = profileInst;
  return profileInst;
};

// ==========================
// Internal
// ==========================

function _load (id, type) {
  if (!_data[id]) {
    _data[id] = {};
  }

  _data[id][type] = ipcPlus.sendToMainSync('electron-profile:query-data', id, type);

  // Query up the inheritance chain
  utils.eachInherit(_type, type, (item) => {
    if (!item.inherit) {
      return;
    }
    _load(id, item.inherit);
  });
};

function _emitChangeForProfile (id, type) {
  let url = utils.o2u(id, type);
  let pCache = _url2profile[url];
  if (pCache) {
    pCache.emit('change');
  }
};

class Profile extends EventEmitter {

  constructor (id, type) {
    super();
    this.id = id;
    this.type = type;
  }

  get (path) {
    path += '';
    if (!utils.checkPath(path)) {
      console.warn(`Path illegal: ${path}`);
      return null;
    }
    let id = this.id;
    let type = this.type;

    let paths = path.split('.');
    let values = [];

    // 1. Profile data
    values.push(utils.findData(_data, id, type));

    // 2. Inheritance chain data
    utils.eachInherit(_type, type, (item) => {
      values.push(utils.findData(_data, id, item.name));
    });

    // 3. Default data
    if (_default[id] && _default[id][type]) {
      values.push(_default[id][type]);
    }

    return utils.searchObject(values, paths);
  }

  set (path, value) {
    path += '';
    if (!utils.checkPath(path)) {
      console.log(`Path illegal: ${path}`);
      return null;
    }

    let id = this.id;
    let type = this.type;

    let paths = path.split('.');
    utils.setObject(_data[id][type], paths, value);
    ipcPlus.sendToMain('electron-profile:profile-set', id, type, path, value);

    _emitChangeForProfile(id, type);
    return value;
  }

  delete (path) {
    let paths = path.split('.');
    let last = paths.pop();
    let data = _data[this.id][this.type];
    paths.forEach((path) => {
      if (data[path]) {
        data = data[path];
      } else {
        data = null;
      }
    });

    if (data) {
      delete data[last];
    }
    ipcPlus.sendToMain('electron-profile:profile-delete', this.id, this.type, path);

    _emitChangeForProfile(this.id, this.type);
  }

  save() {
    ipcPlus.sendToMainSync('electron-profile:profile-save', this.id, this.type);
  }

  clear () {
    let data = _data[this.id][this.type];
    Object.keys(data).forEach((key) => {
      delete data[key];
    });

    _emitChangeForProfile(this.id, this.type);
  }

  reset (profile) {
    this.clear();
    let data = _data[this.id][this.type];
    utils.transferObject(data, profile);
    ipcPlus.sendToMain('electron-profile:profile-reset', this.id, this.type, profile);

    _emitChangeForProfile(this.id, this.type);
  }
}

// ==========================
// Ipc
// ==========================

let __type = ipcPlus.sendToMainSync('electron-profile:query-type');
Object.keys(__type).forEach((key) => {
  _type[key] = __type[key];
});

let __default = ipcPlus.sendToMainSync('electron-profile:query-default');
Object.keys(__default).forEach((key) => {
  _default[key] = __default[key];
});

ipcPlus.on('electron-profile:profile-set', (event, id, type, path, value) => {
  let paths = path.split('.');
  utils.setObject(_data[id][type], paths, value);

  _emitChangeForProfile(id, type);
});

ipcPlus.on('electron-profile:profile-delete', (event, id, type, path) => {
  let paths = path.split('.');
  let last = paths.pop();
  let data = _data[id][type];
  paths.forEach((path) => {
    if (data[path]) {
      data = data[path];
    } else {
      data = null;
    }
  });
  if (data) {
    delete data[last];
  }

  _emitChangeForProfile(id, type);
});

ipcPlus.on('electron-profile:profile-clear', (event, id, type) => {
  let data = _data[id][type];
  Object.keys(data).forEach((key) => {
    delete data[key];
  });

  _emitChangeForProfile(id, type);
});

ipcPlus.on('electron-profile:profile-reset', (event, id, type, profile) => {
  let data = _data[id][type];
  Object.keys(data).forEach((key) => {
    delete data[key];
  });
  utils.transferObject(data, profile);

  _emitChangeForProfile(id, type);
});