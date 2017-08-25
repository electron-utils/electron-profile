'use strict';

const Assert = require('assert');

const Fs = require('fs');
const Path = require('path');
const Type = require('../../lib/main/type');
const Profile = require('../../lib/main/profile');

describe('Profile manager', () => {
    var cache = Profile.source_cache;
    var globalDir = Path.join(__dirname, '../fixtures/global');
    var localDir = Path.join(__dirname, '../fixtures/local');

    before(function () {
        Type.clear();
        
    });

    after(function () {
        Type.clear();
    });


    it('Initialize the profile', () => {
        // 在已有的类型下初始化 profile
        // 应该能够拿到初始化后的数据
        Type.register('global', globalDir);
        Assert.equal(JSON.stringify(cache), '{}');
        Profile.init('user');
        Assert.equal(JSON.stringify(cache.user.global), '{"name":"VisualSJ","position":"global"}');
    });

    it('Additional types', () => {
        // 已经初始化了 profile，再新建一个类型
        // 应该刷新 profile 内的数据缓存
        Type.register('local', localDir);
        Assert.equal(JSON.stringify(cache.user.local), '{"position":"local"}');
    });

    it('Load profile', () => {
        // 拿出之前新建的 user profile
        var user = Profile.load('profile://global/user.json');
        Assert.equal(!!user, true);
    });

    it('Inheritance chain', () => {
        // 检查 user 的 global local 继承关系是否正常
        var globalUser = Profile.load('profile://global/user.json');
        var localUser = Profile.load('profile://local/user.json');
        
        Assert.equal(globalUser.data.position, 'global');
        Assert.equal(localUser.data.position, 'local');
        Assert.equal(localUser.data.name, 'VisualSJ'); // proto
    });

    it('Data default', () => {
        // 检查 user 的默认值是否正常
        var user = Profile.load('profile://local/user.json');

        Profile.setDefault('user', { 
            isJs: true,
        });
        
        Assert.equal(user.data.isJs, true);
    });

    it('Profile cache and data sharing', () => {
        var user1 = Profile.load('profile://local/user.json');
        var user2 = Profile.load('profile://local/user.json');

        Assert.equal(user1, user2);
        user1.data.save = true;
        Assert.equal(user2.data.save, true);
    });

    it('Profile reset', () => {
        var user = Profile.load('profile://local/user.json');
        user.reset({
            email: 'email@VisualSJ.com'
        });
        Assert.equal(user.data.email, 'email@VisualSJ.com');
    });

    it('Profile reload', () => {
        var user = Profile.load('profile://local/user.json');
        user.reload();
        Assert.equal(user.data.save, undefined);
    });

    it('Profile save', () => {
        var user = Profile.load('profile://global/user.json');
        user.data.aaa = true;
        user.save();

        Assert.equal(cache['user']['global']['aaa'], true);
        var temp = Object.keys(cache['user']['local']);
        Assert.equal(temp.indexOf('aaa'), -1);

        var string = Fs.readFileSync(Path.join(globalDir, 'user.json'), 'utf-8');
        var json = JSON.parse(string);
        Assert.equal(json.aaa, true);

        delete user.data.aaa;
        user.save();

        var string = Fs.readFileSync(Path.join(globalDir, 'user.json'), 'utf-8');
        var json = JSON.parse(string);
        Assert.equal(json.aaa, undefined);
        Assert.equal(json.name, 'VisualSJ');
        Assert.equal(json.position, 'global');

    });
});