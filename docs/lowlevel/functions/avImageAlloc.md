[node-av](../globals.md) / avImageAlloc

# Function: avImageAlloc()

> **avImageAlloc**(`width`, `height`, `pixFmt`, `align`): `object`

Defined in: [src/lib/utilities.ts:243](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L243)

Allocate image buffer.

Allocates a buffer large enough to hold an image with the specified dimensions
and pixel format. Returns buffer and layout information.

Direct mapping to av_image_alloc().

## Parameters

### width

`number`

Image width in pixels

### height

`number`

Image height in pixels

### pixFmt

`AVPixelFormat`

Pixel format

### align

`number`

Buffer alignment (typically 1 or 32)

## Returns

`object`

Object with buffer, size, and line sizes

### buffer

> **buffer**: `Buffer`

### linesizes

> **linesizes**: `number`[]

### size

> **size**: `number`

## Throws

If allocation fails

## Example

```typescript
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

const { buffer, size, linesizes } = avImageAlloc(
  1920, 1080, AV_PIX_FMT_YUV420P, 32
);
console.log(`Allocated ${size} bytes`);
console.log(`Line sizes: ${linesizes}`);
```

## See

[avImageGetBufferSize](avImageGetBufferSize.md) To calculate size without allocating
