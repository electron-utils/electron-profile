# Module: profile (main process)

## Methods

### profile.load (url, defaultProfile)

  - `url` string - The url of the profile.
  - `defaultProfile` object - The default profile to use if the profile is not found.

Returns `_Profile` - The Profile instance.


Load profile via `url`, if no profile found, it will use the `defaultProfile` and save it to the disk.
You must register your profile path via `profile.register` before you can use it.

Example:

```javascript
const profile = require('electron-profile');

// register a project profile
profile.register( 'project', '~/foo/bar');

// load the profile at ~/foo/bar/foobar.json
let foobar = Editor.loadProfile( 'profile://project/foobar.json', {
  foo: 'foo',
  bar: 'bar',
});

// change and save your profile
foobar.data.foo = 'hello foo';
foobar.save();
```

### profile.register (type, path)

  - `type` string - The type of the profile you want to register.
  - `path` string - The path for the register type.

Register profile `type` with the `path` you provide.

### profile.reset ()

Reset the registered profiles

### profile.getPath (type)

  - `type` string - The type of the profile you've registered.

Get the registered path by `type`.

### profile.setDefault (url, defaultProfile)

  - `url` string - The url of the profile.
  - `defaultProfile` object - The default profile to use if the profile is not found.

Cache the default profile.

## Class: _Profile

## Instance Properties

### profileInst.data

The data of the profile.

## Instance Methods

### profileInst.save()

### profileInst.reload()

### profileInst.clear()

### profileInst.reset(data)

## Instance Events

### Event: 'changed'