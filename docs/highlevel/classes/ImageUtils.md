[node-av](../globals.md) / ImageUtils

# Class: ImageUtils

Defined in: [utilities/image.ts:48](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/image.ts#L48)

Image buffer utilities.

Provides static methods for allocating, copying, and managing image buffers.
These utilities handle the low-level memory layout for various pixel formats,
including planar formats with multiple buffers.

## Example

```typescript
import { ImageUtils } from 'node-av';
import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';

// Allocate image buffer
const image = ImageUtils.alloc(1920, 1080, AV_PIX_FMT_YUV420P, 32);
console.log(`Allocated ${image.size} bytes`);

// Get buffer size without allocating
const size = ImageUtils.getBufferSize(AV_PIX_FMT_RGB24, 1920, 1080, 1);
console.log(`RGB24 1080p needs ${size} bytes`);
```

## Methods

### alloc()

> `static` **alloc**(`width`, `height`, `pixFmt`, `align`): [`ImageAllocation`](../interfaces/ImageAllocation.md)

Defined in: [utilities/image.ts:79](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/image.ts#L79)

Allocate an image buffer.

Allocates a buffer large enough to hold an image with the specified dimensions
and pixel format. Returns the buffer along with line sizes for each plane.
Direct mapping to av_image_alloc()

#### Parameters

##### width

`number`

Image width in pixels

##### height

`number`

Image height in pixels

##### pixFmt

`AVPixelFormat`

Pixel format

##### align

`number`

Buffer alignment (typically 1, 16, or 32)

#### Returns

[`ImageAllocation`](../interfaces/ImageAllocation.md)

Allocation result with buffer, size, and line sizes

#### Throws

On allocation failure

#### Example

```typescript
import { ImageUtils } from 'node-av';
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Allocate aligned buffer for YUV420P image
const image = ImageUtils.alloc(1920, 1080, AV_PIX_FMT_YUV420P, 32);
console.log(`Buffer size: ${image.size} bytes`);
console.log(`Y plane line size: ${image.linesizes[0]}`);
console.log(`U plane line size: ${image.linesizes[1]}`);
console.log(`V plane line size: ${image.linesizes[2]}`);
```

***

### allocArrays()

> `static` **allocArrays**(`width`, `height`, `pixFmt`, `align`): [`ImageAllocation`](../interfaces/ImageAllocation.md)

Defined in: [utilities/image.ts:100](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/image.ts#L100)

Allocate image buffer arrays (alternative interface).

Similar to alloc() but with a different return format.
This is an alias for compatibility.

#### Parameters

##### width

`number`

Image width in pixels

##### height

`number`

Image height in pixels

##### pixFmt

`AVPixelFormat`

Pixel format

##### align

`number`

Buffer alignment

#### Returns

[`ImageAllocation`](../interfaces/ImageAllocation.md)

Allocation result

#### Throws

On allocation failure

***

### copy()

> `static` **copy**(`dstData`, `dstLinesizes`, `srcData`, `srcLinesizes`, `pixFmt`, `width`, `height`): `void`

Defined in: [utilities/image.ts:131](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/image.ts#L131)

Copy image data between buffers.

Copies image data from source buffers to destination buffers.
Direct mapping to av_image_copy2()

#### Parameters

##### dstData

`Buffer`\<`ArrayBufferLike`\>[]

Destination data buffers (one per plane)

##### dstLinesizes

`number`[]

Destination line sizes

##### srcData

`Buffer`\<`ArrayBufferLike`\>[]

Source data buffers (one per plane)

##### srcLinesizes

`number`[]

Source line sizes

##### pixFmt

`AVPixelFormat`

Pixel format

##### width

`number`

Image width

##### height

`number`

Image height

#### Returns

`void`

#### Example

```typescript
import { ImageUtils } from 'node-av';
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Copy between two image buffers
ImageUtils.copy(
  dstBuffers, dstLinesizes,
  srcBuffers, srcLinesizes,
  AV_PIX_FMT_YUV420P, 1920, 1080
);
```

***

### copyToBuffer()

> `static` **copyToBuffer**(`dst`, `dstSize`, `srcData`, `srcLinesize`, `pixFmt`, `width`, `height`, `align`): `number`

Defined in: [utilities/image.ts:200](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/image.ts#L200)

Copy image to a single buffer.

Copies image data from multiple plane buffers to a single contiguous buffer.
Useful for serialization or when a single buffer is required.
Direct mapping to av_image_copy_to_buffer()

#### Parameters

##### dst

`Buffer`

Destination buffer

##### dstSize

`number`

Destination buffer size

##### srcData

Source data buffers (one per plane), or null

`null` | `Buffer`\<`ArrayBufferLike`\>[]

##### srcLinesize

Source line sizes, or null

`null` | `number`[]

##### pixFmt

`AVPixelFormat`

Pixel format

##### width

`number`

Image width

##### height

`number`

Image height

##### align

`number`

Buffer alignment

#### Returns

`number`

Bytes written, or negative error code

#### Example

```typescript
import { ImageUtils, FFmpegError } from 'node-av';
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Copy planar data to single buffer
const dstSize = ImageUtils.getBufferSize(AV_PIX_FMT_YUV420P, 1920, 1080, 1);
const dst = Buffer.alloc(dstSize);

const written = ImageUtils.copyToBuffer(
  dst, dstSize,
  srcBuffers, srcLinesizes,
  AV_PIX_FMT_YUV420P, 1920, 1080, 1
);

FFmpegError.throwIfError(written, 'Failed to copy image to buffer');
console.log(`Wrote ${written} bytes`);
```

***

### getBufferSize()

> `static` **getBufferSize**(`pixFmt`, `width`, `height`, `align`): `number`

Defined in: [utilities/image.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/image.ts#L160)

Get required buffer size for an image.

Calculates the buffer size needed to store an image with the given parameters.
Direct mapping to av_image_get_buffer_size()

#### Parameters

##### pixFmt

`AVPixelFormat`

Pixel format

##### width

`number`

Image width

##### height

`number`

Image height

##### align

`number`

Buffer alignment

#### Returns

`number`

Required buffer size in bytes

#### Example

```typescript
import { ImageUtils } from 'node-av';
import { AV_PIX_FMT_RGB24, AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Calculate buffer sizes for different formats
const rgbSize = ImageUtils.getBufferSize(AV_PIX_FMT_RGB24, 1920, 1080, 1);
const yuvSize = ImageUtils.getBufferSize(AV_PIX_FMT_YUV420P, 1920, 1080, 1);

console.log(`RGB24: ${rgbSize} bytes`);   // 1920*1080*3
console.log(`YUV420P: ${yuvSize} bytes`); // 1920*1080*1.5
```
