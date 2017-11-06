'use strict';

const {ipcMain} = require('electron');
const fs = require('fs');
const EventEmitter = require('events');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const path = require('path');
const fsJetpack = require('fs-jetpack');

const schema = require('./utils/schema');

let _url2profile = {};
let _url2schema = {};

let _type2path = {};
let _type2parent = {};

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
    _saveJson(path, pobj);
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
 * @method inherit
 * @param {string} type - Current type
 * @param {string} parent - The parent type
 * 
 * Set up a type of inheritance relationship
 * When the data cannot be found, it will query the data at the parent type
 */
profile.inherit = function ( type, parent ) {
  if (!_type2path[parent]) {
    console.warn(`The type of inheritance is not registered yet - ${parent}`);
  }
  _type2parent[type] = parent;
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

  if (_type2parent[type]) {
    console.log(`Failed to register schema ${url}: only root profile can register schema`);
  }
  _url2schema[url] = schema.json2schema(json);
};

// ==========================
// Internal
// ==========================

function _saveJson (file, object) {
  let dir = path.dirname(file);
  fsJetpack.dir(dir);
  fs.writeFileSync(file, JSON.stringify(object, null, 2), 'utf-8');
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
    let schema = this.getSchema(this._type, this._file);
    let target = this._data[key];

    // Find the data on the inheritance chain
    let type = this._type;
    while (target === undefined && _type2parent[type]) {
      let parent = _type2parent[type];
      let parentUrl = `profile://${parent}/${this._file}`;
      let patentProfile = _url2profile[parentUrl];
      target = patentProfile ? patentProfile._data[key] : undefined;
      type = parent;
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
    let json = this.getSchema(this._type, this._file);
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
    _saveJson(path, json);
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

  getSchema () {
    let type = this._type;
    while (_type2parent[type]) {
      type = _type2parent[type];
    }
    return _url2schema[`profile://${type}/${this._file}`];
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
