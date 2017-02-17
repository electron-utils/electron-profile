'use strict';

const platform = require('electron-platform');

let profile;

if ( platform.isMainProcess ) {
  const {app} = require('electron');
  const path = require('path');
  const fsJetpack = require('fs-jetpack');

  profile = require('./lib/main');

  let home = path.join(app.getPath('home'), `.${app.getName()}`);
  let local = path.join(home, 'local');

  // ensure directories exists
  // MacOSX: ~/Library/Logs/.${app-name}
  // Windows: %APPDATA%, some where like 'C:\Users\${user_name}\AppData\Local\...'
  fsJetpack.dir(home);
  fsJetpack.dir(local);

  profile.register('global', home);
  profile.register('local', local);
} else {
  profile = require('./lib/renderer/index');
}

// ==========================
// exports
// ==========================

module.exports = profile;
