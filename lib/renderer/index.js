'use strict';

// requires
const {ipcRenderer} = require('electron');
const ipcPlus = require('electron-ipc-plus');
const EventEmitter = require('events');

let _url2profile = {};

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
 * @param {function} cb - Callback function.
 *
 * Load profile.
 */
profile.load = function ( url, cb ) {
  let pobj = _url2profile[url];
  if ( pobj ) {
    if ( cb ) {
      cb (null, pobj);
    }

    return;
  }

  ipcPlus.sendToMain('electron-profile:load', url, (err, data) => {
    if ( err ) {
      if ( cb ) {
        cb (err);
      }

      return;
    }

    let pobj = new _Profile(url, data);
    _url2profile[url] = pobj;

    if ( cb ) {
      cb (null, pobj);
    }
  });
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
    ipcPlus.sendToMain('electron-profile:save', this._url, this._data);
  }
} // end class Profile

// ==========================
// ipc events
// ==========================

ipcRenderer.on('electron-profile:changed', ( event, url, data ) => {
  let pobj = _url2profile[url];
  if ( pobj ) {
    pobj._data = data;
    pobj.emit('changed');
  }
});
