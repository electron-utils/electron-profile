'use strict';

const cache = {};

class Type {

    constructor (name, path, inherit) {
        this.name = name;
        this.path = path;
        this.inherit = inherit;
    }

    eachInherit (handler) {
        if (!this.inherit) {
            return false;
        }
        let type = exports.findOfName(this.inherit);
        while (type) {
            handler(type);
            type = exports.findOfName(type.inherit);
        }
    }
};

/**
 * @method add
 * @param {String} name 
 * @param {String} path 
 * @param {String} inherit 
 */
let add = function (name, path, inherit) {
    if (!name || !path) {
        return null;
    }
    let type = new Type(name, path, inherit);
    cache[name] = type;
    return type;
};

/**
 * @method findOfName
 * @param {String} name 
 * @return {Type}
 */
let findOfName = function (name) {
    let type = cache[name];
    if (!type) {
        return null;
    }
    return type;
};

/**
 * @method clear
 */
let clear = function () {
    Object.keys(cache).forEach((key) => {
        delete cache[key];
    });
};

exports.add = add;
exports.findOfName = findOfName;
exports.clear = clear;