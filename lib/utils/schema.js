'use strict';

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
    return null;
  }

  let property = schema.properties[key];
  if (!property) {
    return new Error('key not found');
  }
  if (getValueType(value) !== property.type) {
    return new Error(`Wrong type, expect ${getValueType(value)}, got ${property.type}`);
  }

  return null;
};

module.exports = {
  json2schema: json2schema,
  validate: validate,
};