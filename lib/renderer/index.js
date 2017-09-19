'use strict';

// requires
const electron = require('electron');

// Remote profile object, Core layer objects
let remote = null;

function _initRemote () {
  remote = electron.remote.getGlobal('__electron_profile__');
};

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
profile.load = function (url) {
  if (!remote) {
    _initRemote();
  }
  if (!remote) {
    console.error(new Error('The remote profile is not initialized'));
    return null;
  }

  return remote.load(url);
};