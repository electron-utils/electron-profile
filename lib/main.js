'use strict';

const {ipcMain} = require('electron');
const fs = require('fs');
const EventEmitter = require('events');
const protocols = require('electron-protocols');
const ipcPlus = require('electron-ipc-plus');
const path = require('path');
const urlUtils = require('url');

const typeManager = require('./share/type');
const profileManager = require('./share/profile');

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

  let urlItem = urlUtils.parse(url);
  let type = urlItem.hostname;
  let id = path.join(urlItem.pathname, '.json');
  let profileInst = profileManager.load(id, type, defaultProfile);

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
  let urlItem = urlUtils.parse(url);
  let type = urlItem.hostname;
  let id = path.join(urlItem.pathname, '.json');
  profileManager.setDefault(id, type, defaultProfile);
};

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
