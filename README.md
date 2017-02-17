# electron-profile

[![Linux Build Status](https://travis-ci.org/electron-utils/electron-profile.svg?branch=master)](https://travis-ci.org/electron-utils/electron-profile)
[![Windows Build status](https://ci.appveyor.com/api/projects/status/xs18f8goees9w9bb?svg=true)](https://ci.appveyor.com/project/jwu/electron-profile)
[![Dependency Status](https://david-dm.org/electron-utils/electron-profile.svg)](https://david-dm.org/electron-utils/electron-profile)
[![devDependency Status](https://david-dm.org/electron-utils/electron-profile/dev-status.svg)](https://david-dm.org/electron-utils/electron-profile#info=devDependencies)

Store and manipulate your profile for your Electron app.

## Why?

  - Profile migration/update
  - Sync profile changes in runtime for all renderer processes.

## Install

```bash
npm install --save electron-profile
```

## Run Examples:

```bash
npm start examples/${name}
```

## Usage

```javascript
const profile = require('electron-profile');

let settings = profile.load('profile://local/settings.json');
settings.data.user = 'Johnny Wu';
settings.save();
```

## API Reference

  - [Module: profile (main process)](docs/profile-main.md)
  - [Module: profile (renderer process)](docs/profile-renderer.md)

## License

MIT © 2017 Johnny Wu
