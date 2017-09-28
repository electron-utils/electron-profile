'use strict';

const {ipcMain} = require('electron');
const fs = require('fs');
const EventEmitter = require('events');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const path = require('path');

let _url2profile = {};
let _type2path = {};

// register profile://
protocols.register('profile', uri => {
  let base = _type2path[uri.hostname];
  if ( !base ) {
    return null;
  }

  if ( uri.pathname ) {
    return path.join( base, uri.pathname );
  }

  return base;
});

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
  if ( url.indexOf('profile://') !== 0 ) {
    console.error(`Failed to load profile ${url}: invalid protocol.`);
    return;
  }

  let path = protocols.path(url);
  if ( !path ) {
    console.error(`Failed to load profile ${url}: profile type not found.`);
    return null;
  }

  // There is already a cache
  if ( _url2profile[url] ) {
    return _url2profile[url];
  }

  let pobj;
  if ( !fs.existsSync(path) ) {
    pobj = {};
    fs.writeFileSync(path, JSON.stringify(pobj, null, 2));
  } else {
    try {
      pobj = JSON.parse(fs.readFileSync(path));
    } catch ( err ) {
      if ( err ) {
        console.warn(`Failed to load profile ${url}: ${err.message}`);
        pobj = {};
      }
    }
  }

  let profileInst = new _Profile(url, pobj);
  // Add the cache
  _url2profile[url] = profileInst;

  return profileInst;
};

/**
 * @method register
 * @param {string} type - The type of the profile you want to register.
 * @param {string} path - The path for the register type.
 *
 * Register profile type with the path you provide.
 * {{#crossLink "profile.load"}}{{/crossLink}}
 */
profile.register = function ( type, path ) {
  _type2path[type] = path;
};

/**
 * @method reset
 *
 * Reset the registered profiles
 */
profile.reset = function () {
  _type2path = {};
};

/**
 * @method getPath
 *
 * Get path by type
 */
profile.getPath = function ( type ) {
  return _type2path[type];
};

// ==========================
// Internal
// ==========================

let _readDataWithKey = function (target, key) {
  if ( target && key in target ) {
    return target[key];
  }
  return null;
};

let _writeDataWithKey = function (target, key, value) {
  if ( target && typeof target === 'object' ) {
    target[key] = value;
  }
};

class _Profile extends EventEmitter {
  constructor ( url, data ) {
    super();
    this._url = url;
    this._data = data;
  }

  get (path) {
    let paths = path.split('.');
    let target = this._data;
    paths.forEach((path) => {
      target = _readDataWithKey(target, path);
    });

    // return a mutation object
    if (typeof target === 'object') {
      target = JSON.parse(JSON.stringify(target));
    }

    return target;
  }

  set (path, value) {
    let target = this._data;
    let paths = path.split('.');
    let limit = paths.lenght - 1;
    let last = paths.reduce(( a, b, i ) => {
      if ( i >= limit ) {
        return b;
      }

      let tmp = _readDataWithKey(target, a);
      if ( tmp === null || typeof tmp !== 'object' ) {
        tmp = typeof a === 'number' ? [] : {};
        _writeDataWithKey(target, a, tmp);
      }

      target = tmp;

      return b;
    });
    target[last] = value;
  }

  delete (path) {
    let paths = path.split('.');
    let last = paths.pop();
    let target = this._data;
    paths.forEach((path) => {
      target = _readDataWithKey(target, path);
    });
    
    if (target && last in target) {
      delete target[last];
      return true;
    }

    return false;
  }

  save () {
    let path = protocols.path(this._url);
    let json = JSON.stringify(this._data, null, 2);
    fs.writeFileSync(path, json, 'utf8');

    this.emit('changed');
    ipcPlus.sendToWins('electron-profile:changed', this._url, this._data);
  }

  reload () {
    let path = protocols.path(this._url);
    let jsonObj = JSON.parse(fs.readFileSync(path));

    for ( let p in jsonObj ) {
      this._data[p] = jsonObj[p];
    }

    this.emit('changed');
    ipcPlus.sendToWins('electron-profile:changed', this._url, this._data);
  }

  clear () {
    this._data = {};
  }

  reset ( data ) {
    this._data = data;
  }

} // end class Profile

// ==========================
// Ipc
// ==========================

ipcMain.on('electron-profile:load', ( event, url ) => {
  let pobj = profile.load(url);
  let data = pobj ? pobj.data : null;
  event.reply( null, data );
});

ipcMain.on('electron-profile:save', ( event, url, data ) => {
  let pobj = profile.load(url);
  if ( pobj ) {
    pobj.reset(data);
    pobj.save();
  }
});
