'use strict';

const Assert = require('assert');

const Path = require('path');
const Type = require('../../lib/main/type');

describe('Type manager', () => {

    before(function () {
        Type.clear();
        
    });

    after(function () {
        Type.clear();
    });

    it('register', () => {
        var path = Path.join(__dirname, '../temp');
        Type.register('test', path, -1);
        var type = Type.query('test');
        Assert.equal(type.name, 'test');
        Assert.equal(type.path, path);
        Assert.equal(type.index, 0);
        Assert.equal(type.offset, -1);
    });

    it('each', () => {
        Type.register('test2', __dirname);
        Type.each((a, b, i) => {
            if (i === 0) {
                Assert.equal(a.name, 'test');
                Assert.equal(b, null);
            } else if (i === 1) {
                Assert.equal(a.name, 'test2');
                Assert.equal(b.name, 'test');
            }
        });
    });

    it('clear', () => {
        Type.clear();
        var type = Type.query('test');
        Assert.equal(type, null);
    });

    it('update register', () => {
        var path = Path.join(__dirname, '../temp');
        Type.register('test', path, -4);
        var type = Type.query('test');
        Assert.equal(type.name, 'test');
        Assert.equal(type.path, path);
        Assert.equal(type.index, 0);
        Assert.equal(type.offset, -4);

        var mi = 0;
        Type.each((a, b, i) => {
            mi = i;
        });
        Assert.equal(mi, 0);
    });

});