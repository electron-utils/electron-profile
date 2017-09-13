'use strict';

let checkPath = function (path) {
    if (typeof path !== 'string') return false;
    return /^(\w+\.)*\w+$/.test(path);
};

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

exports.checkPath = checkPath;
exports.searchObject = searchObject;
exports.setObject = setObject;
exports.transferObject = transferObject;