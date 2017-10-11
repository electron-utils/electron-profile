'use strict';

const ERROR = {
    NONE: -1,
    UNKNOWN: 0,
    TYPE: 1,
    NOT_DEFINE: 2,
};

/**
 * @method getVauleType
 * @param {*} value 
 */
let getValueType = function (value) {
    switch (typeof value) {
        case 'boolean': return 'boolean';
        case 'number': return 'number';
        case 'string': return 'string';
        case 'object':
            if (!value) {
                return 'null';
            } else if (Array.isArray(value)) {
                return 'array';
            } else {
                return 'object';
            }
        default: return 'null';
    }
};

/**
 * @method json2schema
 * Convert json to schema
 * @param {object} json - json object
 */
let json2schema = function (json) {
    console.log(json)
    let schema = {
        type: 'object',
        properties: {},
    };

    Object.keys(json).forEach((key) => {
        let property = {};
        property.type = getValueType(json[key]);
        property.default = json[key];
        schema.properties[key] = property;
    });

    return schema;
};

/**
 * @method validate
 * @param {object} schema 
 * @param {string} key
 * @param {all} value 
 */
let validate = function (schema, key, value) {
    if (!schema || !schema.properties) {
        return ERROR.NONE;
    }

    let property = schema.properties[key];
    if (!property) {
        return ERROR.NOT_DEFINE;
    }
    if (getValueType(value) !== property.type) {
        return ERROR.TYPE;
    }

    return ERROR.NONE;
};

exports.ERROR = ERROR;
exports.json2schema = json2schema;
exports.validate = validate;