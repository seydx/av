[node-av](../globals.md) / PixelFormat

# Class: PixelFormat

Defined in: [utilities/pixel-format.ts:34](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/pixel-format.ts#L34)

Video pixel format utilities.

Provides static methods for querying pixel format properties, converting
between format names and values, and checking hardware acceleration support.

## Example

```typescript
import { PixelFormat } from 'node-av';
import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_CUDA } from 'node-av/constants';

// Get format information
console.log(PixelFormat.getName(AV_PIX_FMT_YUV420P));    // "yuv420p"
console.log(PixelFormat.isHardware(AV_PIX_FMT_CUDA));    // true

// Convert between names and values
const format = PixelFormat.fromName("yuv420p");
console.log(format === AV_PIX_FMT_YUV420P);              // true
```

## Methods

### fromName()

> `static` **fromName**(`name`): `AVPixelFormat`

Defined in: [utilities/pixel-format.ts:81](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/pixel-format.ts#L81)

Get pixel format from name.

Converts a pixel format name string to its enum value.
Direct mapping to av_get_pix_fmt()

#### Parameters

##### name

`string`

Pixel format name string

#### Returns

`AVPixelFormat`

Pixel format enum value, or AV_PIX_FMT_NONE for unknown formats

#### Example

```typescript
import { PixelFormat } from 'node-av';
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

const format = PixelFormat.fromName("yuv420p");
console.log(format === AV_PIX_FMT_YUV420P); // true

const invalid = PixelFormat.fromName("invalid");
console.log(invalid === AV_PIX_FMT_NONE);   // true
```

***

### getName()

> `static` **getName**(`format`): `null` \| `string`

Defined in: [utilities/pixel-format.ts:56](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/pixel-format.ts#L56)

Get the name of a pixel format.

Returns a string describing the pixel format.
Direct mapping to av_get_pix_fmt_name()

#### Parameters

##### format

`AVPixelFormat`

Video pixel format

#### Returns

`null` \| `string`

Format name string, or null for invalid format

#### Example

```typescript
import { PixelFormat } from 'node-av';
import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';

console.log(PixelFormat.getName(AV_PIX_FMT_YUV420P)); // "yuv420p"
console.log(PixelFormat.getName(AV_PIX_FMT_RGB24));   // "rgb24"
```

***

### isHardware()

> `static` **isHardware**(`format`): `boolean`

Defined in: [utilities/pixel-format.ts:105](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/pixel-format.ts#L105)

Check if pixel format is hardware accelerated.

Returns true if the pixel format represents frames in GPU/hardware memory
rather than system memory.
Direct mapping to av_pix_fmt_desc_get() and checking for AV_PIX_FMT_FLAG_HWACCEL

#### Parameters

##### format

`AVPixelFormat`

Video pixel format

#### Returns

`boolean`

True if format is hardware accelerated

#### Example

```typescript
import { PixelFormat } from 'node-av';
import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_CUDA, AV_PIX_FMT_VAAPI } from 'node-av/constants';

console.log(PixelFormat.isHardware(AV_PIX_FMT_YUV420P)); // false
console.log(PixelFormat.isHardware(AV_PIX_FMT_CUDA));    // true
console.log(PixelFormat.isHardware(AV_PIX_FMT_VAAPI));   // true
```
