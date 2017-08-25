'use strict';

const Fs = require('fs');

/**
 * 清空一个对象
 * @param {Object} object
 */
exports.clearObject = function (object) {
    if (!object) return;
    Object.keys(object).forEach((key) => {
        delete object[key];
    });
};

/**
 * 复制一个对象
 * @param {Object} object
 * @param {Object} refer
 */
exports.copyObject = function (object, refer) {
    if (!object || !refer) return;
    Object.keys(refer).forEach((key) => {
        object[key] = refer[key];
    });
};

/**
 * 解析一个 url，获取 id 和 type 信息
 * @param {String} url
 */
exports.parseUrl = function (url) {
    var match = url.match(/profile\:\/\/(local|global)\/(\S+)\.json/);
    var id = match && match[2] ? match[2] : '';
    var type = match && match[1] ? match[1] : '';

    return {
        id: id,
        type: type,
    };
};

/**
 * 读取文件内定义的 json 数据
 * @param {String} path 
 */
exports.readJsonFromFile = function (path) {
    if (!Fs.existsSync(path)) {
        return {};
    }
    try {
        let file = Fs.readFileSync(path, 'utf-8');
        return JSON.parse(file);
    } catch (error) {
        return {};
    };
};