'use strict';

const assert = require('assert');
const fsJetpack = require('fs-jetpack');

const type = require('../../lib/type');

describe('type', () => {

    let root = `${__dirname}/../fixtures/profiles`;

    before(() => {
        fsJetpack.dir(root, {empty: true});
    });


    it('add', () => {
        assert.equal(type.add(), null);
        assert.equal(type.add('test'), null);
        assert.equal(!!type.add('test', root), true);
    });

    it('findOfName', () => {
        let typeItem = type.findOfName('test');

        assert.equal(typeItem.name, 'test');
        assert.equal(typeItem.path, root);
        assert.equal(typeItem.inherit, undefined);
    });

    it('eachInherit', () => {
        type.add('test2', __dirname, 'test')
        let typeItem = type.findOfName('test2');
        let length = 0;
        typeItem.eachInherit((t) => {
            length += 1;
            assert.equal(t.name, 'test');
            assert.equal(t.path, root);
            assert.equal(t.inherit, undefined);
        });
        assert.equal(length, 1);
    });
});