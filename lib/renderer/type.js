'use strict';

const Events = require('events');

class TypeManager extends Events.EventEmitter {
    
    constructor () {
        super();
        // 注册类型的层级排序队列
        this.list = [];
    }

    /**
     * 主动更新 type 队列
     */
    updateList (list, inform) {
        this.list = list;
        if (inform) {
            this.emit('list-changed', list);
        }
    }

    each (handler) {
        var prev = null;
        this.list.forEach((name, index) => {
            handler(name, prev, index);
            prev = name;
        });
    }

};

module.exports = new TypeManager();