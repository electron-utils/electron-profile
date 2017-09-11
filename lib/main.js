'use strict';

const {ipcMain} = require('electron');
const fs = require('fs');
const EventEmitter = require('events');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const path = require('path');

const typeManager = require('./type');

let _url2default = {};
let _url2profile = {};

// register profile://
protocols.register('profile', uri => {
  let typeItem = typeManager.findOfName(uri.hostname);
  if ( !typeItem ) {
    return null;
  }
  let base = typeItem.path;
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
 * @param {object} defaultProfile - The default profile to use if the profile is not found.
 * @return {object} A Profile instance.
 * @see profile.register
 *
 * Load profile via `url`, if no profile found, it will use the `defaultProfile` and save it to the disk.
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
profile.load = function ( url, defaultProfile ) {
  if ( url.indexOf('profile://') !== 0 ) {
    console.error(`Failed to load profile ${url}: invalid protocol.`);
    return;
  }

  let path = protocols.path(url);
  if ( !path ) {
    console.error(`Failed to load profile ${url}: profile type not found.`);
    return null;
  }

  // update default profile if any
  if ( defaultProfile ) {
    profile.setDefault(url, defaultProfile);
  }

  //
  let pobj = _url2profile[url];
  if ( pobj ) {
    return pobj;
  }

  // get default profile (again)
  defaultProfile = _url2default[url];

  pobj = defaultProfile || {};

  if ( !fs.existsSync(path) ) {
    fs.writeFileSync(path, JSON.stringify(pobj, null, 2));
  } else {
    try {
      pobj = JSON.parse(fs.readFileSync(path));

      if ( defaultProfile ) {
        for ( let p in pobj ) {
          if ( defaultProfile[p] === undefined ) {
            delete pobj[p];
            console.warn(`Profile ${url} warning: delete unused profile field: ${p}`);
          }
        }

        for ( let p in defaultProfile ) {
          if (pobj[p] === undefined ) {
            pobj[p] = defaultProfile[p];
          } else if ( typeof(pobj[p]) !== typeof(defaultProfile[p]) ) {
            pobj[p] = defaultProfile[p];
            console.warn(`Profile ${url} warning: reset profile field: ${p}`);
          }
        }

        // save again
        fs.writeFileSync(path, JSON.stringify(pobj, null, 2));
      }
    } catch ( err ) {
      if ( err ) {
        console.warn(`Failed to load profile ${url}: ${err.message}`);
        pobj = {};
      }
    }
  }

  let profileInst = new _Profile(url, pobj);
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
  typeManager.add(type, path, inherit);
};

/**
 * @method reset
 *
 * Reset the registered profiles
 */
profile.reset = function () {
  typeManager.clear();
};

/**
 * @method getPath
 *
 * Get path by type
 */
profile.getPath = function ( type ) {
  let typeItem = typeManager.findOfName(type);
  if (!typeItem) {
    return '';
  }
  return typeItem.path;
};

/**
 * @method setDefault
 * @param {string} url
 * @param {object} defaultProfile
 *
 * Cache the default profile
 */
profile.setDefault = function ( url, defaultProfile ) {
  _url2default[url] = defaultProfile;
};

// ==========================
// Internal
// ==========================

class _Profile extends EventEmitter {
  constructor ( url, data ) {
    super();
    this._url = url;
    this._data = data;
  }

  get data () { return this._data; }

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
