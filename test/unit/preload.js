'use strict';

const path = require('path');
const profile = require('../../index');
profile.register('fixtures', path.resolve(`${__dirname}/../fixtures/`));
