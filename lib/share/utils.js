'use strict';

const _fs = require('fs');
const _url = require('url');
const _path = require('path');

/**
 * @method checkPath
 * @param {string} path - search path
 */
let checkPath = function (path) {
  if (typeof path !== 'string') return false;
  return /^(\w+\.)*\w+$/.test(path);
};

/**
 * @method searchObject
 * @param {array} values - search target list
 * @param {array} paths - search path list
 */
let searchObject = function (values, paths) {
  paths.forEach((key) => {
    values = values.filter((item) => {
      return key in item;
    });
    values = values.map((item) => {
      return item[key];
    });
  });

  let value = null;
  if (values.length > 0) {
    value = values[0];
  }
  if (value === undefined) {
    value = null;
  }
  return value;
};

/**
 * @method setObject
 * @param {object} object - Target
 * @param {array} paths - Search path list
 * @param {*} value - Target value
 */
let setObject = function (object, paths, value) {
  let target = object;
  let last = paths.pop();
  paths.forEach((key) => {
    if (typeof target[key] === 'object') {
      target = target[key];
    } else {
      target[key] = {};
      target = target[key];
    }
  });
  target[last] = value;
};

/**
 * @method transferObject
 * @param {object} target - Target
 * @param {*} contrast - The object being copied
 */
let transferObject = function (target, contrast) {
  Object.keys(contrast).forEach((key) => {
    if (typeof target === 'Object' && !Array.isArray(target)) {
      transferObject(target[key], contrast[key]);
    } else {
      if (contrast[key] === undefined) {
        delete target[key];
      } else {
        target[key] = contrast[key];
      }
    }
  });
};

/**
 * @method o2u
 * @param {string} id - Profile id
 * @param {string} type - Profile type
 */
let o2u = function (id, type) {
  return `profile://${type}/${id}.json`;
};

/**
 * @method u2o
 * @param {string} url - Profile url
 */
let u2o = function (url) {
  let item = _url.parse(url);
  return {
    id: item.pathname.replace(/(^\/|^\\|\.json$)/g, ''),
    type: item.hostname,
  };
};

/**
 * @method readJson
 * @param {string} path 
 */
let readJson = function (path) {
  if (!_fs.existsSync(path)) {
    return {};
  }

  try {
    let string = _fs.readFileSync(path, 'utf-8');
    return JSON.parse(string);
  } catch (error) {
    console.error(error);
    return {};
  }
};

/**
 * @method eachInherit
 * @param {object} types
 * @param {object} type
 * @param {function} handler
 */
let eachInherit = function (types, type, handler) {
  let item = types[type];
  if (!item) {
    throw new Error(`The profile type is lost: ${type}`);
    console.warn(`The profile type is lost: ${type}`);
    return false;
  }
  while (item.inherit && types[item.inherit]) {
    handler(types[item.inherit]);
    item = types[item.inherit];
  }
};

/**
 * @method findData
 * @param {object} data 
 * @param {string} id 
 * @param {string} type 
 */
let findData = function (data, id, type) {
  if (!data[id] || !data[id][type]) {
    console.warn(`The profile cache data is lost: profile://${type}/${id}.json`);
    return {};
  }
  return data[id][type];
};

exports.checkPath = checkPath;
exports.searchObject = searchObject;
exports.setObject = setObject;
exports.transferObject = transferObject;
exports.o2u = o2u;
exports.u2o = u2o;
exports.readJson = readJson;
exports.eachInherit = eachInherit;
exports.findData = findData;