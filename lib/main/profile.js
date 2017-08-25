'use strict';

const Fs = require('fs');
const Path = require('path');
const Events = require('events');

const Utils = require('../utils');
const Type = require('./type');

class Profile extends Events.EventEmitter {

    constructor (source, type) {
        super();
        this._data = {};
        this._source = source;
        this._type = type;

        var proto = this._source[this._type];
        Utils.clearObject(this._data);
        Utils.copyObject(this._data, proto);
        this._data.__proto__ = proto;
    }

    get data () {
        return this._data;
    }

    /**
     * 数据从当前的缓存回流到 manager 的缓存内
     * 并发出 save 事件
     * manager 监听到事件之后需要将数据保存到指定位置
     */
    save () {
        var proto = this._source[this._type];
        Utils.clearObject(proto);
        Utils.copyObject(proto, this._data);

        // 数据需要落地
        this.emit('save');
    }

    /**
     * 放弃当前缓存的数据，从 manager 的公共缓存内重置数据
     */
    reload () {
        var proto = this._source[this._type];
        Utils.clearObject(this._data);
        Utils.copyObject(this._data, proto);

        this.emit('changed');
    }

    /**
     * 清空当前的数据
     */
    clear () {
        var proto = this._source[this._type];
        Utils.clearObject(this._data);

        this.emit('changed');
    }

    /**
     * 将当前的数据重置为指定的数据
     * @param {Object} data 
     */
    reset (data) {
        Utils.clearObject(this._data);
        Utils.copyObject(this._data, data);

        this.emit('changed');
    }

}

class ProfileManager extends Events.EventEmitter {

    constructor () {
        super();
        
        this.id_list = [];
        this.default_cache = {
            // id: JSON
        };
        this.source_cache = {
            // id: { type: JSON }
            // foo: { global: { bar: '' }, local: { bar: 'bar' } }
        };
        this.profile_cache = {
            // url: Profile
            // 'profile://global/setting.json': Profile
        };

        Type.on('register', (typeObj) => {

            this.id_list.forEach((id) => {
                var cache = this.source_cache[id];

                var path = Path.join(typeObj.path, `${id}.json`);
                cache[typeObj.name] = Utils.readJsonFromFile(path);
            });

            // 重构继承链
            this.refactoring();
        });
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

    /**
     * 初始化 profile
     * @param {String} id 
     */
    init (id) {
        this.id_list.push(id);

        if (!this.default_cache[id]) {
            this.default_cache[id] = {};
        }
        
        var cache = this.source_cache[id] = {};
        Type.each((typeObj) => {
            var path = Path.join(typeObj.path, `${id}.json`);
            cache[typeObj.name] = Utils.readJsonFromFile(path);
        });
        this.refactoring();
    }

    /**
     * 注销 profile
     * @param {String} id 
     */
    destroy (id) {

    }

    /**
     * 为一个已经初始化的 profile 设置默认值
     * @param {String} id 
     * @param {Object} json 
     */
    setDefault (id, json) {
        if (!this.default_cache[id]) {
            console.error(`Failed to set default profile ${id}: the profile is not initialized.`);
            return null;
        }
        Utils.clearObject(this.default_cache[id]);
        Utils.copyObject(this.default_cache[id], json);
    }

    /**
     * 根据既定的协议，拿到指定的 profile
     * @param {String} url 
     */
    load (url) {
        if ( url.indexOf('profile://') !== 0 ) {
            console.error(`Failed to load profile ${url}: invalid protocol.`);
            return null;
        }

        if (this.profile_cache[url]) {
            return this.profile_cache[url];
        }

        var info = Utils.parseUrl(url);
        var source = this.source_cache[info.id];

        if (!source) {
            console.error(`Failed to load profile ${url}: missing data.`);
            return null;
        }

        var profile = new Profile(source, info.type);
        this.profile_cache[url] = profile;

        // 数据存储到 json 内
        profile.on('save', () => {
            var typeObj = Type.query(info.type);
            var path = Path.join(typeObj.path, `${info.id}.json`);

            var data = JSON.stringify(source[info.type], null, 2);
            Fs.writeFileSync(path, data, 'utf-8');

            this.emit('profile-changed', info, data);
        });

        return profile;
    }

}

module.exports = new ProfileManager();