# Module: profile (main process)

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

### profile.register (type, path)

  - `type` string - The type of the profile you want to register.
  - `path` string - The path for the register type.

Register profile `type` with the `path` you provide.

### profile.inherit

  - `type` string - Current type
  - `parent` string - The parent type

Sets the parent of the given type. This allows you get profile value from your parent (even parent's parent profile) when the value not found in current profile.

### profile.reset ()

Reset the registered profiles

### profile.getPath (type)

  - `type` string - The type of the profile you've registered.

Get the registered path by `type`.

### profile.registerSchema (url, json)

  - `url` string - The url of the profile.
  - `json` object - Restricted input type, And the default profile to use if the profile is not found.

Set a schema for profile. And the schema data to use if the profile is not found.
NOTE: only root profile have the schema.

## Class: _Profile

## Instance Properties

### profileInst.get (key)

  - `key` string - Data key value

Gets the stored data.

### profileInst.set (key, value)

  - `key` string - Data key value
  - `value` Profile data

## Instance Methods

### profileInst.save()

### profileInst.reload()

### profileInst.clear()

### profileInst.reset(data)

### profileInst.getSchema()

Gets the schema currently in effect.

## Instance Events

### Event: 'changed'