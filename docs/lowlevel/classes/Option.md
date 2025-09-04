[node-av](../globals.md) / Option

# Class: Option

Defined in: [src/lib/option.ts:240](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L240)

FFmpeg option management utilities.

Provides static methods for getting, setting, and querying options
on FFmpeg objects that support the AVOption API. Handles type conversion
and validation for various option types including strings, numbers,
rationals, pixel formats, and more.

Direct mapping to FFmpeg's AVOption API.

## Example

```typescript
import { Option, FFmpegError } from 'node-av';
import { AV_OPT_SEARCH_CHILDREN, AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Set various option types
let ret = Option.set(obj, 'preset', 'fast');
FFmpegError.throwIfError(ret, 'set preset');

ret = Option.setInt(obj, 'bitrate', 2000000);
FFmpegError.throwIfError(ret, 'set bitrate');

ret = Option.setRational(obj, 'framerate', { num: 30, den: 1 });
FFmpegError.throwIfError(ret, 'set framerate');

// Get option values
const preset = Option.get(obj, 'preset');
const bitrate = Option.getInt(obj, 'bitrate');
const framerate = Option.getRational(obj, 'framerate');

// List all options
let opt = null;
while ((opt = Option.next(obj, opt))) {
  console.log(`${opt.name}: ${opt.help}`);
}
```

## See

 - \[AVOption API\](https://ffmpeg.org/doxygen/trunk/group\_\_avoptions.html)
 - OptionMember For inherited option support

## Constructors

### Constructor

> **new Option**(): `Option`

#### Returns

`Option`

## Methods

### copy()

> `static` **copy**(`dest`, `src`): `number`

Defined in: [src/lib/option.ts:621](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L621)

Copy options between objects.

Copies option values from source to destination.

Direct mapping to av_opt_copy().

#### Parameters

##### dest

`OptionCapableObject`

Destination object

##### src

`OptionCapableObject`

Source object

#### Returns

`number`

0 on success, negative AVERROR on error

***

### find()

> `static` **find**(`obj`, `name`, `searchFlags`): `null` \| [`OptionInfo`](OptionInfo.md)

Defined in: [src/lib/option.ts:285](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L285)

Find option by name.

Searches for an option with the specified name.

Direct mapping to av_opt_find().

#### Parameters

##### obj

`OptionCapableObject`

Object to search

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| [`OptionInfo`](OptionInfo.md)

Option info if found, null otherwise

#### Example

```typescript
const opt = Option.find(obj, 'bitrate');
if (opt) {
  console.log(`Found: ${opt.name}, Type: ${opt.type}`);
}
```

***

### find2()

> `static` **find2**(`obj`, `name`, `searchFlags`): `null` \| \{ `isDifferentTarget`: `boolean`; `option`: `null` \| [`OptionInfo`](OptionInfo.md); \}

Defined in: [src/lib/option.ts:310](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L310)

Find option with target info.

Like find() but also indicates if option was found on different target.

Direct mapping to av_opt_find2().

#### Parameters

##### obj

`OptionCapableObject`

Object to search

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| \{ `isDifferentTarget`: `boolean`; `option`: `null` \| [`OptionInfo`](OptionInfo.md); \}

Object with option and target info

#### Example

```typescript
const result = Option.find2(obj, 'bitrate', AV_OPT_SEARCH_CHILDREN);
if (result?.option) {
  console.log(`Found on ${result.isDifferentTarget ? 'child' : 'object'}`);
}
```

***

### free()

> `static` **free**(`obj`): `void`

Defined in: [src/lib/option.ts:662](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L662)

Free option resources.

Direct mapping to av_opt_free().

#### Parameters

##### obj

`OptionCapableObject`

Object to free options from

#### Returns

`void`

***

### get()

> `static` **get**(`obj`, `name`, `searchFlags`): `null` \| `string`

Defined in: [src/lib/option.ts:329](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L329)

Get string option value.

Direct mapping to av_opt_get().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| `string`

Option value as string, or null

***

### getChannelLayout()

> `static` **getChannelLayout**(`obj`, `name`, `searchFlags`): `null` \| [`ChannelLayout`](../interfaces/ChannelLayout.md)

Defined in: [src/lib/option.ts:427](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L427)

Get channel layout option value.

Direct mapping to av_opt_get_chlayout().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| [`ChannelLayout`](../interfaces/ChannelLayout.md)

Channel layout, or null

***

### getDict()

> `static` **getDict**(`obj`, `name`, `searchFlags`): `null` \| [`Dictionary`](Dictionary.md)

Defined in: [src/lib/option.ts:441](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L441)

Get dictionary option value.

Direct mapping to av_opt_get_dict_val().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| [`Dictionary`](Dictionary.md)

Dictionary value, or null

***

### getDouble()

> `static` **getDouble**(`obj`, `name`, `searchFlags`): `null` \| `number`

Defined in: [src/lib/option.ts:357](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L357)

Get double option value.

Direct mapping to av_opt_get_double().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| `number`

Option value as double, or null

***

### getImageSize()

> `static` **getImageSize**(`obj`, `name`, `searchFlags`): `null` \| \{ `height`: `number`; `width`: `number`; \}

Defined in: [src/lib/option.ts:413](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L413)

Get image size option value.

Direct mapping to av_opt_get_image_size().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| \{ `height`: `number`; `width`: `number`; \}

Width and height, or null

***

### getInt()

> `static` **getInt**(`obj`, `name`, `searchFlags`): `null` \| `number`

Defined in: [src/lib/option.ts:343](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L343)

Get integer option value.

Direct mapping to av_opt_get_int().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| `number`

Option value as integer, or null

***

### getPixelFormat()

> `static` **getPixelFormat**(`obj`, `name`, `searchFlags`): `null` \| `AVPixelFormat`

Defined in: [src/lib/option.ts:385](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L385)

Get pixel format option value.

Direct mapping to av_opt_get_pixel_fmt().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| `AVPixelFormat`

Pixel format value, or null

***

### getRational()

> `static` **getRational**(`obj`, `name`, `searchFlags`): `null` \| [`IRational`](../interfaces/IRational.md)

Defined in: [src/lib/option.ts:371](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L371)

Get rational option value.

Direct mapping to av_opt_get_q().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| [`IRational`](../interfaces/IRational.md)

Option value as rational, or null

***

### getSampleFormat()

> `static` **getSampleFormat**(`obj`, `name`, `searchFlags`): `null` \| `AVSampleFormat`

Defined in: [src/lib/option.ts:399](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L399)

Get sample format option value.

Direct mapping to av_opt_get_sample_fmt().

#### Parameters

##### obj

`OptionCapableObject`

Object to query

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| `AVSampleFormat`

Sample format value, or null

***

### isSetToDefault()

> `static` **isSetToDefault**(`obj`, `name`, `searchFlags`): `null` \| `boolean`

Defined in: [src/lib/option.ts:635](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L635)

Check if option is set to default.

Direct mapping to av_opt_is_set_to_default().

#### Parameters

##### obj

`OptionCapableObject`

Object to check

##### name

`string`

Option name

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`null` \| `boolean`

True if default, false if modified, null if not found

***

### next()

> `static` **next**(`obj`, `prev`): `null` \| [`OptionInfo`](OptionInfo.md)

Defined in: [src/lib/option.ts:260](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L260)

Iterate to next option.

Iterates through available options on an object.

Direct mapping to av_opt_next().

#### Parameters

##### obj

`OptionCapableObject`

Object with options

##### prev

Previous option (null to get first)

`null` | [`OptionInfo`](OptionInfo.md)

#### Returns

`null` \| [`OptionInfo`](OptionInfo.md)

Next option, or null if no more

#### Example

```typescript
let opt = null;
while ((opt = Option.next(obj, opt))) {
  console.log(`Option: ${opt.name}`);
}
```

***

### serialize()

> `static` **serialize**(`obj`, `optFlags`, `flags`, `keyValSep`, `pairsSep`): `null` \| `string`

Defined in: [src/lib/option.ts:651](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L651)

Serialize options to string.

Direct mapping to av_opt_serialize().

#### Parameters

##### obj

`OptionCapableObject`

Object to serialize

##### optFlags

`number` = `0`

Option flags filter

##### flags

`number` = `0`

Serialization flags

##### keyValSep

`string` = `'='`

Key-value separator

##### pairsSep

`string` = `','`

Pairs separator

#### Returns

`null` \| `string`

Serialized string, or null on error

***

### set()

> `static` **set**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:457](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L457)

Set string option value.

Direct mapping to av_opt_set().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

`string`

String value

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setBin()

> `static` **setBin**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:593](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L593)

Set binary option value.

Direct mapping to av_opt_set_bin().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

`Buffer`

Binary data

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setChannelLayout()

> `static` **setChannelLayout**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:563](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L563)

Set channel layout option value.

Direct mapping to av_opt_set_chlayout().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

`number`

Channel layout

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setDefaults()

> `static` **setDefaults**(`obj`): `void`

Defined in: [src/lib/option.ts:606](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L606)

Set defaults on object.

Sets all options to their default values.

Direct mapping to av_opt_set_defaults().

#### Parameters

##### obj

`OptionCapableObject`

Object to reset

#### Returns

`void`

***

### setDict()

> `static` **setDict**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:578](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L578)

Set dictionary option value.

Direct mapping to av_opt_set_dict_val().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

[`Dictionary`](Dictionary.md)

Dictionary value

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setDouble()

> `static` **setDouble**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:487](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L487)

Set double option value.

Direct mapping to av_opt_set_double().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

`number`

Double value

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setImageSize()

> `static` **setImageSize**(`obj`, `name`, `width`, `height`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:548](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L548)

Set image size option value.

Direct mapping to av_opt_set_image_size().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### width

`number`

Image width

##### height

`number`

Image height

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setInt()

> `static` **setInt**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:472](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L472)

Set integer option value.

Direct mapping to av_opt_set_int().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

Integer value

`number` | `bigint`

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setPixelFormat()

> `static` **setPixelFormat**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:517](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L517)

Set pixel format option value.

Direct mapping to av_opt_set_pixel_fmt().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

`AVPixelFormat`

Pixel format

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setRational()

> `static` **setRational**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:502](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L502)

Set rational option value.

Direct mapping to av_opt_set_q().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

[`IRational`](../interfaces/IRational.md)

Rational value

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### setSampleFormat()

> `static` **setSampleFormat**(`obj`, `name`, `value`, `searchFlags`): `number`

Defined in: [src/lib/option.ts:532](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L532)

Set sample format option value.

Direct mapping to av_opt_set_sample_fmt().

#### Parameters

##### obj

`OptionCapableObject`

Object to modify

##### name

`string`

Option name

##### value

`AVSampleFormat`

Sample format

##### searchFlags

`AVOptionSearchFlags` = `AVFLAG_NONE`

Search flags

#### Returns

`number`

0 on success, negative AVERROR on error

***

### show()

> `static` **show**(`obj`, `reqFlags`, `rejFlags`): `number`

Defined in: [src/lib/option.ts:676](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L676)

Show options for debugging.

Direct mapping to av_opt_show2().

#### Parameters

##### obj

`OptionCapableObject`

Object to show options for

##### reqFlags

`number` = `0`

Required flags

##### rejFlags

`number` = `0`

Rejected flags

#### Returns

`number`

0 on success, negative AVERROR on error
