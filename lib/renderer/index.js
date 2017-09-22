'use strict';

// requires
const electron = require('electron');

// Remote profile object, Core layer objects
let _remoteProfile = electron.remote.getGlobal('__electron_profile__');

if (!_remoteProfile) {
  console.error('Failed to init electron-profile, make sure you require it in main process');
}

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
  if (!_remoteProfile) {
    return null;
  }

  return _remoteProfile.load(url);
};