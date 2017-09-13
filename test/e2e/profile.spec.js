'use strict';

const path = require('path');
const electron = require('electron');
const assert = require('assert');
const fsJetpack = require('fs-jetpack');
const { Application } = require('spectron');

describe('profile', function () {

    const PATH = {
        GLOBAL: path.join(__dirname, '../fixtures/global'),
        LOCAL: path.join(__dirname, '../fixtures/local'),
        GJSON: path.join(__dirname, '../fixtures/global/user.json'),
        LJSON: path.join(__dirname, '../fixtures/local/user.json'),
    };

    const PROFILE = {
        GLOBAL: {
            name: 'v...',
            info: { timestamp: 1505185942887 },
        },
        LOCAL: {
            name: 'VisualSJ'
        },
    };

    this.timeout(0);
    let app = null;

    before(function () {
        fsJetpack.dir(PATH.GLOBAL, {empty: true});
        fsJetpack.dir(PATH.LOCAL, {empty: true});
        fsJetpack.write(PATH.GJSON, JSON.stringify(PROFILE.GLOBAL));
        fsJetpack.write(PATH.LJSON, JSON.stringify(PROFILE.LOCAL));

        app = new Application({
            path: electron,
            args: [path.join(__dirname, '..', 'fixtures', 'app-profile')]
        });
        return app.start();
    });

    after(function () {
        // fsJetpack.remove(PATH.GLOBAL);
        // fsJetpack.remove(PATH.LOCAL);

        if (app && app.isRunning()) {
            // return app.stop();
        }
    });

    let logs = [];
    it('should be ok in load profile (main)', () => {
        return app.client
            .getMainProcessLogs()
            .then((results) => {
                logs = results;
                assert.equal(logs[0], 'load success');
            });
    });
    it('should be ok in get profile (main)', () => {
        assert.equal(logs[1], 'VisualSJ');
        assert.equal(logs[2], 'null');
        assert.equal(logs[3], '1505185942887');
        assert.equal(logs[4], 'true');
        assert.equal(logs[5], 'true');
    });
    it('should be ok in set profile (main)', () => {
        assert.equal(logs[5], 'true');
        assert.equal(logs[6], 'false');
    });

    it('should be ok in save profile (main)', () => {
        let json = JSON.parse(fsJetpack.read(PATH.LJSON));
        assert.equal(json.test, false);
        assert.equal(json.a.b.c, true);
    });

    it('should be ok in delete profile (main)', () => {
        let json = JSON.parse(fsJetpack.read(PATH.LJSON));
        assert.equal(logs[7], 'null');
        assert.equal(logs[8], 'null');
    });

    it('should be ok in reload profile (main)', () => {
        assert.equal(logs[9], 'true');
    });

    it('should be ok in clear profile (main)', () => {
        assert.equal(logs[10], 'null');
    });

    it('should be ok in reset profile (main)', () => {
        assert.equal(logs[11], 'false');
        assert.equal(logs[12], '1');
    });


});