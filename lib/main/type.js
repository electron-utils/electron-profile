'use strict';

const Events = require('events');
const Utils = require('../utils');

class TypeManager extends Events.EventEmitter {

    constructor () {
        super();
        this.cache = {};
        this.list = [];
    }

    getList () {
        return this.list;
    }

    register (name, path, levelOffset) {
        var type = {
            name: name,
            path: path,
            index: this.list.length,
            offset: levelOffset || 0
        };
        this.cache[name] = type;
        var exists = !this.list.some((item) => {
            return item.name === name;
        });

        if (exists) {
            this.list.push(type);
        }

        this.list.sort((a, b) => {
            return (a.index + a.offset) - (b.index + b.offset);
        });

        this.emit('register', type, this.list);
    }

    clear () {
        Utils.clearObject(this.cache);
        this.list.length = 0;

        this.emit('clear');
    }

    each (handler) {
        var prev = null;
        this.list.forEach((name, index) => {
            handler(name, prev, index);
            prev = name;
        });
    }

    query (id) {
        return this.cache[id];
    }
}

module.exports = new TypeManager();
