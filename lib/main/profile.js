'use strict';

const Fs = require('fs');
const Path = require('path');
const Events = require('events');

const Utils = require('../utils');
const Type = require('./type');

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

        var typeObj = Type.query(this._type);
        var path = Path.join(typeObj.path, `${this._id}.json`);

        Fs.writeFileSync(path, JSON.stringify(proto, null, 2), 'utf-8');

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

        // 注册了新的类型的时候，需要更新所有的缓存的初始化数据
        Type.on('register', (typeObj) => {

            this.id_list.forEach((id) => {
                var cache = this.source_cache[id];
                if (cache[typeObj.name]) {
                    return;
                }

                let path = Path.join(typeObj.path, `${id}.json`);
                cache[typeObj.name] = Utils.readJsonFromFile(path);

                // 读取到新的 profile 的时候，通知页面层
                this.emit('profile-changed', {
                    id: id,
                    default: this.default_cache[id],
                    type: typeObj.name,
                    source: cache,
                });
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
            this.init(id);
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
            this.init(info.id);
            source = this.source_cache[info.id];
        }

        var profile = new Profile(source, info);
        this.profile_cache[url] = profile;

        profile.on('save', () => {
            this.emit('profile-changed', {
                id: info.id,
                default: this.default_cache[info.id],
                type: info.type,
                source: source,
            });
        })

        return profile;
    }

    /**
     * 更新 profile
     * @param {Object} data 
     * @param {Boolean} needSave 
     */
    updateProfile (data, needSave) {

        var type = data.type;
        var id = data.id;

        // 更新 profile 缓存
        var url = `profile://${type}/${id}.json`;
        var profile = this.profile_cache[url];
        if (!profile) return;
        var dist = data.source[data.type];
        profile.reset(dist);

        // 更新 source 缓存
        Utils.clearObject(this.source_cache[id][type]);
        Utils.copyObject(this.source_cache[id][type], dist);

        // 保存
        if (needSave) {
            var typeObj = Type.query(data.type);
            var path = Path.join(typeObj.path, `${data.id}.json`);
            Fs.writeFileSync(path, JSON.stringify(dist, null, 2), 'utf-8');
        }
    }
}

module.exports = new ProfileManager();
