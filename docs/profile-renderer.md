# Module: profile (renderer process)

## Methods

### profile.load (url)

  - `url` string - The url of the profile.

Returns `_Profile` - The Profile instance.


Load profile via `url`.
You must register your profile path via `profile.register` before you can use it.
You also can set a schema for your profile via `profile.registerSchema`. NOTE: only root profile have the schema.

Example:

```javascript
const profile = require('electron-profile');

// register a project profile
profile.register( 'project', '~/foo/bar');

// load the profile at ~/foo/bar/foobar.json
let foobar = profile.load('profile://project/foobar.json');

profile.registerSchema({
  foo: 'foo',
  bar: 'bar',
});

// change and save your profile
foobar.set('foo', 'hello foo');
foobar.save();
```

## Class: _Profile

Refer to main's _Profile：

  - [Module: profile (main process)](docs/profile-main.md)