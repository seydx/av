[node-av](../globals.md) / MediaType

# Class: MediaType

Defined in: [utilities/media-type.ts:30](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/media-type.ts#L30)

Media type utilities.

Provides static methods for converting media type enum values to
human-readable strings.

## Example

```typescript
import { MediaType } from 'node-av';
import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';

console.log(MediaType.getString(AVMEDIA_TYPE_VIDEO));      // "video"
console.log(MediaType.getString(AVMEDIA_TYPE_AUDIO));      // "audio"
console.log(MediaType.getString(AVMEDIA_TYPE_SUBTITLE));   // "subtitle"
```

## Methods

### getString()

> `static` **getString**(`type`): `null` \| `string`

Defined in: [utilities/media-type.ts:61](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/media-type.ts#L61)

Get string representation of media type.

Converts a media type enum value to its string representation.
Direct mapping to av_get_media_type_string()

#### Parameters

##### type

`AVMediaType`

Media type enum value

#### Returns

`null` \| `string`

String representation, or null for invalid type

#### Example

```typescript
import { MediaType } from 'node-av';
import {
  AVMEDIA_TYPE_VIDEO,
  AVMEDIA_TYPE_AUDIO,
  AVMEDIA_TYPE_DATA,
  AVMEDIA_TYPE_SUBTITLE,
  AVMEDIA_TYPE_ATTACHMENT
} from 'node-av/constants';

console.log(MediaType.getString(AVMEDIA_TYPE_VIDEO));      // "video"
console.log(MediaType.getString(AVMEDIA_TYPE_AUDIO));      // "audio"
console.log(MediaType.getString(AVMEDIA_TYPE_DATA));       // "data"
console.log(MediaType.getString(AVMEDIA_TYPE_SUBTITLE));   // "subtitle"
console.log(MediaType.getString(AVMEDIA_TYPE_ATTACHMENT)); // "attachment"
```
