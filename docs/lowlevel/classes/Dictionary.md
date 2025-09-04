[node-av](../globals.md) / Dictionary

# Class: Dictionary

Defined in: [src/lib/dictionary.ts:48](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L48)

Key-value dictionary for FFmpeg options and metadata.

Stores string key-value pairs used throughout FFmpeg for options, metadata,
and configuration. Provides methods for setting, getting, and manipulating
dictionary entries. Used extensively for codec options, format options,
and metadata handling.

Direct mapping to FFmpeg's AVDictionary.

## Example

```typescript
import { Dictionary, FFmpegError } from 'node-av';
import { AV_DICT_IGNORE_SUFFIX } from 'node-av/constants';

// Create from object
const dict = Dictionary.fromObject({
  'title': 'My Video',
  'artist': 'Me',
  'year': '2024'
});

// Set individual values
const dict2 = new Dictionary();
dict2.alloc();
let ret = dict2.set('preset', 'fast');
FFmpegError.throwIfError(ret, 'set');

// Parse from string
ret = dict2.parseString('key1=value1:key2=value2', '=', ':');
FFmpegError.throwIfError(ret, 'parseString');

// Get all entries
const entries = dict2.getAll();
console.log(entries); // { key1: 'value1', key2: 'value2' }
```

## See

 - \[AVDictionary\](https://ffmpeg.org/doxygen/trunk/group\_\_lavu\_\_dict.html)
 - [CodecContext](CodecContext.md) For codec options
 - [FormatContext](FormatContext.md) For format options

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeDictionary`\>

## Constructors

### Constructor

> **new Dictionary**(): `Dictionary`

Defined in: [src/lib/dictionary.ts:51](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L51)

#### Returns

`Dictionary`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/dictionary.ts:366](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L366)

Dispose of the dictionary.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using dict = new Dictionary();
  dict.alloc();
  dict.set('key', 'value');
  // Use dict...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(): `void`

Defined in: [src/lib/dictionary.ts:122](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L122)

Allocate a dictionary.

Allocates memory for the dictionary structure.
Must be called before using the dictionary.

Direct mapping to av_dict_alloc().

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
const dict = new Dictionary();
dict.alloc();
// Dictionary is now ready for use
```

#### See

[free](#free) To deallocate

***

### copy()

> **copy**(`dst`, `flags`): `number`

Defined in: [src/lib/dictionary.ts:169](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L169)

Copy entries to another dictionary.

Copies all entries from this dictionary to the destination.

Direct mapping to av_dict_copy().

#### Parameters

##### dst

`Dictionary`

Destination dictionary

##### flags

`AVDictFlag` = `AVFLAG_NONE`

Copy flags

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const dst = new Dictionary();
dst.alloc();
const ret = src.copy(dst);
FFmpegError.throwIfError(ret, 'copy');
```

***

### count()

> **count**(): `number`

Defined in: [src/lib/dictionary.ts:251](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L251)

Count dictionary entries.

Returns the number of key-value pairs in the dictionary.

Direct mapping to av_dict_count().

#### Returns

`number`

Number of entries

#### Example

```typescript
const count = dict.count();
console.log(`Dictionary has ${count} entries`);
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/dictionary.ts:143](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L143)

Free the dictionary.

Releases all memory associated with the dictionary.
The dictionary becomes invalid after calling this.

Direct mapping to av_dict_free().

#### Returns

`void`

#### Example

```typescript
dict.free();
// Dictionary is now invalid
```

#### See

 - [alloc](#alloc) To allocate
 - Symbol.dispose For automatic cleanup

***

### get()

> **get**(`key`, `flags`): `null` \| `string`

Defined in: [src/lib/dictionary.ts:232](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L232)

Get a dictionary entry.

Retrieves the value for a given key.

Direct mapping to av_dict_get().

#### Parameters

##### key

`string`

Entry key to look up

##### flags

`AVDictFlag` = `AVFLAG_NONE`

Search flags (e.g., AV_DICT_IGNORE_SUFFIX)

#### Returns

`null` \| `string`

Entry value, or null if not found

#### Example

```typescript
const value = dict.get('bitrate');
if (value) {
  console.log(`Bitrate: ${value}`);
}

// Case-insensitive search
import { AV_DICT_MATCH_CASE } from 'node-av/constants';
const title = dict.get('Title', AV_DICT_MATCH_CASE);
```

#### See

 - [set](#set) To set values
 - [getAll](#getall) To get all entries

***

### getAll()

> **getAll**(): `Record`\<`string`, `string`\>

Defined in: [src/lib/dictionary.ts:272](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L272)

Get all dictionary entries.

Returns all key-value pairs as a JavaScript object.

#### Returns

`Record`\<`string`, `string`\>

Object with all entries

#### Example

```typescript
const entries = dict.getAll();
for (const [key, value] of Object.entries(entries)) {
  console.log(`${key}: ${value}`);
}
```

#### See

[get](#get) To get individual entries

***

### getNative()

> **getNative**(): `NativeDictionary`

Defined in: [src/lib/dictionary.ts:346](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L346)

**`Internal`**

Get the underlying native Dictionary object.

#### Returns

`NativeDictionary`

The native Dictionary binding object

#### Implementation of

`NativeWrapper.getNative`

***

### getString()

> **getString**(`keyValSep`, `pairsSep`): `null` \| `string`

Defined in: [src/lib/dictionary.ts:335](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L335)

Convert dictionary to string.

Serializes all entries to a formatted string.

Direct mapping to av_dict_get_string().

#### Parameters

##### keyValSep

`string`

Separator between key and value

##### pairsSep

`string`

Separator between pairs

#### Returns

`null` \| `string`

Formatted string, or null on error

#### Example

```typescript
// Serialize to colon-separated format
const str = dict.getString('=', ':');
console.log(str); // "key1=val1:key2=val2"

// Serialize to comma-separated format
const csv = dict.getString('=', ',');
console.log(csv); // "key1=val1,key2=val2"
```

#### See

[parseString](#parsestring) To parse from string

***

### parseString()

> **parseString**(`str`, `keyValSep`, `pairsSep`, `flags`): `number`

Defined in: [src/lib/dictionary.ts:307](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L307)

Parse entries from a string.

Parses key-value pairs from a formatted string and adds them
to the dictionary.

Direct mapping to av_dict_parse_string().

#### Parameters

##### str

`string`

String to parse

##### keyValSep

`string`

Separator between key and value

##### pairsSep

`string`

Separator between pairs

##### flags

`AVDictFlag` = `AVFLAG_NONE`

Parse flags

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid format
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Parse colon-separated pairs
let ret = dict.parseString('key1=val1:key2=val2', '=', ':');
FFmpegError.throwIfError(ret, 'parseString');

// Parse comma-separated pairs
ret = dict.parseString('width=1920,height=1080', '=', ',');
FFmpegError.throwIfError(ret, 'parseString');
```

#### See

[getString](#getstring) To serialize to string

***

### set()

> **set**(`key`, `value`, `flags`): `number`

Defined in: [src/lib/dictionary.ts:202](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L202)

Set a dictionary entry.

Sets or updates a key-value pair in the dictionary.

Direct mapping to av_dict_set().

#### Parameters

##### key

`string`

Entry key

##### value

`string`

Entry value

##### flags

`AVDictFlag` = `AVFLAG_NONE`

Set flags (e.g., AV_DICT_DONT_OVERWRITE)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_DICT_DONT_OVERWRITE } from 'node-av/constants';

// Set or update entry
let ret = dict.set('bitrate', '128k');
FFmpegError.throwIfError(ret, 'set');

// Set only if not exists
ret = dict.set('preset', 'fast', AV_DICT_DONT_OVERWRITE);
FFmpegError.throwIfError(ret, 'set');
```

#### See

[get](#get) To retrieve values

***

### fromNative()

> `static` **fromNative**(`native`): `Dictionary`

Defined in: [src/lib/dictionary.ts:97](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L97)

**`Internal`**

Create dictionary from native instance.

#### Parameters

##### native

`NativeDictionary`

Native dictionary instance

#### Returns

`Dictionary`

Dictionary wrapper

***

### fromObject()

> `static` **fromObject**(`obj`, `flags`): `Dictionary`

Defined in: [src/lib/dictionary.ts:81](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/dictionary.ts#L81)

Create dictionary from JavaScript object.

Convenience method to create a dictionary from a plain object.

#### Parameters

##### obj

`Record`\<`string`, `string`\>

Object with string key-value pairs

##### flags

`AVDictFlag` = `AVFLAG_NONE`

Flags for setting entries

#### Returns

`Dictionary`

New dictionary with entries from object

#### Example

```typescript
const metadata = Dictionary.fromObject({
  'title': 'My Song',
  'album': 'My Album',
  'date': '2024',
  'track': '1/10'
});

// Use for codec options
const options = Dictionary.fromObject({
  'preset': 'medium',
  'crf': '23',
  'profile': 'high'
});
```
