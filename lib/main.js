'use strict';

const {ipcMain} = require('electron');
const fs = require('fs');
const EventEmitter = require('events');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const path = require('path');

const schema = require('./utils/schema');

let _url2profile = {};
let _url2schema = {};

let _type2path = {};
let _type2inherit = {};

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
 * @param {string} inherit - Inherit from which type.
 *
 * Register profile type with the path you provide.
 * {{#crossLink "profile.load"}}{{/crossLink}}
 */
profile.register = function ( type, path, inherit ) {
  _type2path[type] = path;
  if (inherit) {
    if (!_type2path[inherit]) {
      console.warn(`The type of inheritance is not registered yet - ${inherit}`);
    }
    _type2inherit[type] = inherit;
  }
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

/**
 * @method registerSchema
 * 
 * Register schema for specific url
 */
profile.registerSchema = function ( url, json ) {
  if (!_url2profile[url] || !json) {
    return;
  }

  if ( url.indexOf('profile://') !== 0 ) {
    console.error(`Failed to load profile ${url}: invalid protocol.`);
    return;
  }

  let type = url.match(/^profile:\/\/([^\/]+)/)[1];

  if (_type2inherit[type]) {
    console.log(`Warnning to register schema ${url}: The schema only takes effect on the root type`);
  }
  _url2schema[url] = schema.json2schema(json);
};

// ==========================
// Internal
// ==========================

let _searchRootType = function (type) {
  while (_type2inherit[type]) {
    type = _type2inherit[type];
  }
  return type;
};

class _Profile extends EventEmitter {
  constructor ( url, data ) {
    super();
    this._url = url;
    this._data = data;

    let match = url.match(/^profile\:\/\/([^\/]+)\/(.*)$/);
    this._type = match[1];
    this._file = match[2];
  }

  get (key) {
    let root = _searchRootType(this._type);
    let schema = _url2schema[`profile://${root}/${this._file}`];
    let target = this._data[key];

    // Find the data on the inheritance chain
    let type = this._type;
    while (target === undefined && _type2inherit[type]) {
      let inherit = _type2inherit[type];
      let inheritUrl = `profile://${inherit}/${this._file}`;
      let inheritProfile = _url2profile[inheritUrl];
      target = inheritProfile ? inheritProfile._data[key] : undefined;
      type = inherit;
    }

    if (schema && target === undefined) {
      let property = schema.properties[key];
      target = property ? property.default : target;
    }

    // return a mutation object
    if (target && typeof target === 'object') {
      target = JSON.parse(JSON.stringify(target));
    }
    return target;
  }

  set (key, value) {
    let root = _searchRootType(this._type);
    let json = _url2schema[`profile://${root}/${this._file}`];
    let error = schema.validate(json, key, value);
    if (error) {
      return console.warn(`Failed to set profile ${key}: ${error}`);
    }

    this._data[key] = value;
  }

  remove (key) {
    delete this._data[key];
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
