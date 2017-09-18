'use strict';

const assert = require('assert');
const utils = require('../../lib/share/utils');

describe('utils', function () {

  it('Enter a wrong path', () => {
    assert.equal(utils.checkPath(), false);
    assert.equal(utils.checkPath(''), false);
    assert.equal(utils.checkPath('a.'), false);
    assert.equal(utils.checkPath('.a'), false);
    assert.equal(utils.checkPath({}), false);
    assert.equal(utils.checkPath([]), false);
    assert.equal(utils.checkPath(null), false);
  });

  it('Enter a correct path', () => {
    assert.equal(utils.checkPath('a'), true);
    assert.equal(utils.checkPath('a.a'), true);
    assert.equal(utils.checkPath('a.a.a'), true);
    assert.equal(utils.checkPath('1'), true);
  });

  let values = [
    {
      delete: undefined,
      string: '',
      number: 0,
      object: {
        string: '1',
        number: 1,
      }
    }, {
      delete: 'delete',
      empty: null,
      array: [{ t: 0 }, { t: 1 }],
      object: {
        empty: null,
        array: [{ t: 2 }, { t: 3 }],
      }
    }
  ];

  it('Search for a undefined', () => {
    let value = utils.searchObject(values, ['undefined']);
    assert.equal(value, null);
  });

  it('Search for a string', () => {
    let string = utils.searchObject(values, ['string']);
    let string2 = utils.searchObject(values, ['object', 'string']);
    assert.equal(string, '');
    assert.equal(string2, '1');
  });

  it('Search for a number', () => {
    let number = utils.searchObject(values, ['number']);
    let number2 = utils.searchObject(values, ['object', 'number']);
    assert.equal(number, 0);
    assert.equal(number2, 1);
  });

  it('Search for a empty', () => {
    let empty = utils.searchObject(values, ['empty']);
    let empty2 = utils.searchObject(values, ['object', 'empty']);
    assert.equal(empty, null);
    assert.equal(empty2, null);
  });

  it('Search for a array', () => {
    let array = utils.searchObject(values, ['array']);
    let array2 = utils.searchObject(values, ['object', 'array']);
    assert.equal(array, values[1]['array']);
    assert.equal(array2, values[1]['object']['array']);
    let array3 = utils.searchObject(values, ['array', '0', 't']);
    assert.equal(array3, 0);
  });

  it('Set value to object', () => {
    let target = {
      string: '',
      object: {
        string: '',
      }
    };
    utils.setObject(target, ['object', 'number'], 0);
    assert.equal(target.object.number, 0);
    utils.setObject(target, ['a', 'b'], 'c');
    assert.equal(!!target.a, true);
    assert.equal(target.a.b, 'c');
    utils.setObject(target, ['string', 'a'], 'b');
    assert.equal(target.string.a, 'b');
  });

  it('The properties of the transferred object', () => {
    let target = {};

    utils.transferObject(target, { a: 0 });
    assert.equal(target.a, 0);

    utils.transferObject(target, { a: { b: 0 } });
    assert.equal(target.a.b, 0);

    utils.transferObject(target, { a: undefined });
    assert.equal('a' in target, false);

  });
});