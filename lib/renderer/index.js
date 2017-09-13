'use strict';

// requires
const { ipcRenderer } = require('electron');
const ipcPlus = require('electron-ipc-plus');
const EventEmitter = require('events');
const path = require('path');
const urlUtils = require('url');

const utils = require('../share/utils');
const typeManager = require('../share/type');
const profilemanager = require('../share/profile');

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
  let urlItem = urlUtils.parse(url);
  let type = urlItem.hostname;
  let id = path.basename(urlItem.pathname, '.json');

  return profilemanager.load(id, type, defaultProfile);
};