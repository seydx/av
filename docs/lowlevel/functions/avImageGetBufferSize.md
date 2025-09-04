[node-av](../globals.md) / avImageGetBufferSize

# Function: avImageGetBufferSize()

> **avImageGetBufferSize**(`pixFmt`, `width`, `height`, `align`): `number`

Defined in: [src/lib/utilities.ts:320](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L320)

Get image buffer size.

Calculates the required buffer size for an image without allocating.

Direct mapping to av_image_get_buffer_size().

## Parameters

### pixFmt

`AVPixelFormat`

Pixel format

### width

`number`

Image width

### height

`number`

Image height

### align

`number`

Buffer alignment

## Returns

`number`

Required buffer size in bytes

## Example

```typescript
import { AV_PIX_FMT_RGB24 } from 'node-av/constants';

const size = avImageGetBufferSize(AV_PIX_FMT_RGB24, 1920, 1080, 1);
console.log(`Need ${size} bytes for Full HD RGB24`);
```

## See

[avImageAlloc](avImageAlloc.md) To allocate the buffer
