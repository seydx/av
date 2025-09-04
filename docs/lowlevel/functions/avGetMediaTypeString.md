[node-av](../globals.md) / avGetMediaTypeString

# Function: avGetMediaTypeString()

> **avGetMediaTypeString**(`mediaType`): `null` \| `string`

Defined in: [src/lib/utilities.ts:210](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L210)

Get media type string.

Returns a human-readable string for the media type.

Direct mapping to av_get_media_type_string().

## Parameters

### mediaType

`AVMediaType`

Media type enum

## Returns

`null` \| `string`

Media type name, or null if unknown

## Example

```typescript
import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';

const video = avGetMediaTypeString(AVMEDIA_TYPE_VIDEO); // Returns "video"
const audio = avGetMediaTypeString(AVMEDIA_TYPE_AUDIO); // Returns "audio"
```
