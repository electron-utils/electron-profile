'use strict';

const {ipcMain, BrowserWindow} = require('electron');
const fs = require('fs');
const EventEmitter = require('events');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const path = require('path');

const utils = require('./share/utils');

// =================
// Protocol
// =================

// register profile://
protocols.register('profile', uri => {
  let typeItem = _type[uri.hostname];
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

// ===================
// Cache
// ===================

// Profile type cache { name: { path: String, inherit: String } }
const _type = {};
// Profile data cache { id: { type: Object } }
const _data = {};
// Profile object cache
const _url2profile = {};

// ==========================
// exports
// ==========================

/**
 * @module profile
 *
 * module for operating Profile class.
 */
let profile = {};
module.exports = profile;

/**
 * @method load
 * @param {string} url - The url of the profile.
 * @return {object} A Profile instance.
 * @see profile.register
 *
 * Load profile via `url`.
 * You must register your profile path via {@link profile.register} before you
 * can use it.
 *
 * @example
 *
 * ```js
 * const profile = require('electron-profile');
 *
 * // register a project profile
 * profile.register( 'project', '~/foo/bar');
 *
 * // load the profile at ~/foo/bar/foobar.json
 * let foobar = profile.load('profile://project/foobar.json', {
 *   foo: 'foo',
 *   bar: 'bar',
 * });
 *
 * // change and save your profile
 * foobar.data.foo = 'hello foo';
 * foobar.save();
 * ```
 */
profile.load = function ( url ) {
  if (_url2profile[url]) {
    return _url2profile[url];
  }

  if ( url.indexOf('profile://') !== 0 ) {
    console.error(`Failed to load profile ${url}: invalid protocol.`);
    return;
  }

  let path = protocols.path(url);
  if ( !path ) {
    console.error(`Failed to load profile ${url}: profile type not found.`);
    return null;
  }

  let urlobj = utils.u2o(url);

  _load(urlobj.id, urlobj.type);

  let profileInst = new _Profile(urlobj.id, urlobj.type);
  _url2profile[url] = profileInst;
  return profileInst;
};

/**
 * @method register
 * @param {string} type - The type of the profile you want to register.
 * @param {string} path - The path for the register type.
 * @param {string} inherit - When you can't find `key`, look it up from the inherited profile
 * 
 * Register profile type with the path you provide.
 * {{#crossLink "profile.load"}}{{/crossLink}}
 */
profile.register = function ( type, path, inherit ) {
  _type[type] = {
    name: type,
    path: path,
    inherit: inherit,
  };
};

/**
 * @method reset
 *
 * Reset the registered profiles
 */
profile.reset = function () {
  Object.keys(_type).forEach((key) => {
    delete _type[key];
  });
};

/**
 * @method getPath
 *
 * Get path by type
 */
profile.getPath = function ( type ) {
  let typeItem = _type[type];
  if (!typeItem) {
    return '';
  }
  return typeItem.path;
};

// ==========================
// Internal
// ==========================

function _load (id, type) {
  if (!_data[id]) {
    _data[id] = {};
  }

  let url = utils.o2u(id, type);
  let path = protocols.path(url);
  if (path && fs.existsSync(path)) {
    _data[id][type] = utils.readJson(path);
  } else {
    _data[id][type] = {};
  }

  // Query up the inheritance chain
  utils.eachInherit(_type, type, (item) => {
    if (!item.inherit) {
      return;
    }
    _load(id, item.inherit);
  });
};

function _sendAllWhitoutSender (sender, message, ...args) {
  let winlist = BrowserWindow.getAllWindows();
  for ( let i = 0; i < winlist.length; ++i ) {
    let win = winlist[i];
    if ( win.webContents.isDestroyed() || win.webContents.id === sender.id ) {
      continue;
    }
    win.webContents.send(message, ...args);
  }
};

function _emitChangeForProfile (id, type) {
  let url = utils.o2u(id, type);
  let pCache = _url2profile[url];
  if (pCache) {
    pCache.emit('change');
  }
};

class _Profile extends EventEmitter {
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

    _emitChangeForProfile(this.id, this.type);
  }

  save() {
    let data = _data[this.id][this.type];
    let url = `profile://${this.type}/${this.id}.json`;
    let path = protocols.path(url);
    fs.writeFileSync(path, JSON.stringify(data));
  }

  reload () {
    _load(this.id, this.type);
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

    _emitChangeForProfile(this.id, this.type);
  }

};

// ==========================
// Ipc
// ==========================

ipcPlus.on('electron-profile:query-type', (event) => {
  event.returnValue = _type;
});

ipcPlus.on('electron-profile:query-data', (event, id, type) => {
  let returnValue;
  if (!_data[id] || !_data[id][type]) {
    returnValue = {};
  } else {
    returnValue = _data[id][type];
  }
  event.returnValue = returnValue;
});

ipcPlus.on('electron-profile:profile-set', (event, id, type, path, value) => {
  let paths = path.split('.');
  if (!_data[id]) {
    _data[id] = {};
  }
  if (!_data[id][type]) {
    _data[id][type] = {};
  }
  utils.setObject(_data[id][type], paths, value);

  _sendAllWhitoutSender(event.sender, 'electron-profile:profile-set', id, type, path, value);

  _emitChangeForProfile(id, type);
});

ipcPlus.on('electron-profile:profile-delete', (event, id, type, path) => {
  let paths = path.split('.');
  let last = paths.pop();
  if (!_data[id]) {
    _data[id] = {};
  }
  if (!_data[id][type]) {
    _data[id][type] = {};
  }
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

  _sendAllWhitoutSender(event.sender, 'electron-profile:profile-delete', id, type, path);

  _emitChangeForProfile(id, type);
});

ipcPlus.on('electron-profile:profile-clear', (event, id, type) => {
  if (!_data[id]) {
    _data[id] = {};
  }
  if (!_data[id][type]) {
    _data[id][type] = {};
  }
  let data = _data[id][type];
  Object.keys(data).forEach((key) => {
    delete data[key];
  });

  _emitChangeForProfile(id, type);
});

ipcPlus.on('electron-profile:profile-save', (event, id, type) => {
  if (!_data[id]) {
    _data[id] = {};
  }
  if (!_data[id][type]) {
    _data[id][type] = {};
  }
  let data = _data[id][type];
  let url = `profile://${type}/${id}.json`;
  let path = protocols.path(url);
  fs.writeFileSync(path, JSON.stringify(data));
  event.returnValue = true;
});

ipcPlus.on('electron-profile:profile-reset', (event, id, type, profile) => {
  if (!_data[id]) {
    _data[id] = {};
  }
  if (!_data[id][type]) {
    _data[id][type] = {};
  }
  let data = _data[id][type];
  Object.keys(data).forEach((key) => {
    delete data[key];
  });
  utils.transferObject(data, profile);

  _sendAllWhitoutSender(event.sender, 'electron-profile:profile-reset', id, type, profile);

  _emitChangeForProfile(id, type);
});