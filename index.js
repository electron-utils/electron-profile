'use strict';

const platform = require('electron-platform');
const pkgJson = require('./package.json');

let profile;
let name = `__electron_profile__`;
let msg = `Failed to require ${pkgJson.name}@${pkgJson.version}:
  A different version of ${pkgJson.name} already running in the process, we will redirect to it.
  Please make sure your dependencies use the same version of ${pkgJson.name}.`;

if ( platform.isMainProcess ) {
  if (global[name]) {
    console.warn(msg);
    profile = global[name];
  } else {
    const {app} = require('electron');
    const path = require('path');
    const fsJetpack = require('fs-jetpack');

    profile = global[name] = require('./lib/main');

    //
    let home = path.join(app.getPath('home'), `.${app.getName()}`);
    let local = path.join(home, 'local');

    // ensure directories exists
    // MacOSX: ~/Library/Logs/.${app-name}
    // Windows: %APPDATA%, some where like 'C:\Users\${user_name}\AppData\Local\...'
    fsJetpack.dir(home);
    fsJetpack.dir(local);

    profile.register('global', home);
    profile.register('local', local);
  }
} else {
  if (window[name]) {
    console.warn(msg);
    profile = window[name];
  } else {
    profile = window[name] = require('./lib/renderer/index');
  }
}

// ==========================
// exports
// ==========================

module.exports = profile;
