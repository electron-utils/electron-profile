'use strict';

const IpcPlus = require('electron-ipc-plus');
const Events = require('events');
const Type = require('./type');
const Utils = require('../Utils');

class Profile extends Events.EventEmitter {

    constructor (source, info) {
        super();
        this._data = {};
        this._source = source;
        this._type = info.type;
        this._id = info.id;

        var proto = this._source[this._type];
        Utils.clearObject(this._data);
        Utils.copyObject(this._data, proto);
        this._data.__proto__ = proto;
    }

    isInclude (key) {
        var keys = Object.keys(this._data);
        return keys.indexOf(key) !== -1;
    }

    get data () {
        return this._data;
    }

    save () {
        var proto = this._source[this._type];
        Utils.clearObject(proto);
        Utils.copyObject(proto, this._data);

        // 数据需要落地
        this.emit('save');
    }

}


class ProfileManager extends Events.EventEmitter {

    constructor () {
        super();

        // 初始化已经缓存了的 id 列表
        this.id_list = [];
        this.source_cache = {};
        this.default_cache = {};

        this.profile_cache = {};

        // 住进程注销了 profile 之后，子进程需要同步
        IpcPlus.on('electron-profile:profile-destroy', (event, id) => {
            var index = this.id_list.indexOf(id);
            if (index === -1) {
                return;
            }
            delete this.default_cache[id];
            delete this.source_cache[id];
            Type.each((type) => {
                delete this.profile_cache[`profile://${type.name}/${id}.json`];
            });
        });
    }

    load (url, callback) {
        if (this.profile_cache[url]) {
            callback(null, this.profile_cache[url]);
            return;
        }

        // load 加载完毕后进行初始化和缓存
        IpcPlus.sendToMain('electron-profile:load', url, (error, data) => {
            if (error) {
                console.warn(error);
                callback(error, null);
                return;
            }

            if (!this.source_cache[data.id]) {
                this.source_cache[data.id] = {};
            } else {
                Utils.clearObject(this.source_cache[data.id]);
            }
            if (!this.default_cache[data.id]) {
                this.default_cache[data.id] = {};
            } else {
                Utils.clearObject(this.default_cache[data.id]);
            }

            Object.keys(data.source).forEach((key) => {
                if (!this.source_cache[data.id][key]) {
                    this.source_cache[data.id][key] = {};
                }
                Utils.copyObject(this.source_cache[data.id][key], data.source[key]);
            });

            Utils.copyObject(this.default_cache[data.id], data.default);

            if (data.source) {
                this.id_list.push(data.id);
            }

            this.updateProfile(data);

            var profile = new Profile(this.source_cache[data.id], data);
            this.profile_cache[url] = profile;

            profile.on('save', () => {

                IpcPlus.sendToMain('electron-profile:profile-changed', {
                    id: data.id,
                    default: manager.default_cache[data.id],
                    type: data.type,
                    source: this.source_cache[data.id],
                });
            });

            callback(null, profile);
        });
    }

    updateProfile (data) {
        var profile_cache = this.profile_cache[`profile://${data.type}/${data.id}.json`];
        if (profile_cache) {
            Utils.copyObject(profile_cache._data, data.source[data.type]);
        }

        var source_cache = this.source_cache[data.id];
        if (source_cache) {
            Utils.clearObject(source_cache[data.type]);
            Utils.copyObject(source_cache[data.type], data.source[data.type]);
        }

        var default_cache = this.default_cache[data.id];
        if (default_cache) {
            Utils.clearObject(default_cache);
            Utils.copyObject(default_cache, data.default);
        }

        if (data.source && this.id_list.indexOf(data.id) === -1) {
            this.id_list.push(data.id);
        }

        this.refactoring();
    }

    /**
     * 重构继承链关系
     */
    refactoring () {

        this.id_list.forEach((id) => {
            var cache = this.source_cache[id];
            Type.each((typeObj, prevTypeObj) => {

                var current = typeObj.name;
                var prev = prevTypeObj ? prevTypeObj.name : null;

                if (!prev) {
                    cache[current].__proto__ = this.default_cache[id];
                    return;
                }

                cache[current].__proto__ = cache[prev];
            });
        });
    }

}

var manager = module.exports = new ProfileManager();

Type.on('list-changed', (list) => {

    list.forEach((typeObj) => {
        manager.id_list.forEach((id) => {
            var cache = manager.source_cache[id];
            cache[typeObj.name] = {};
        });
        manager.refactoring();
    });
});

IpcPlus.on('electron-profile:profile-changed', (event, data) => {
    var cache = manager.source_cache[data.id];
    if (!cache) return;
    manager.updateProfile(data);
});