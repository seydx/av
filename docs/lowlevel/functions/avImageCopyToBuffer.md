[node-av](../globals.md) / avImageCopyToBuffer

# Function: avImageCopyToBuffer()

> **avImageCopyToBuffer**(`dst`, `dstSize`, `srcData`, `srcLinesize`, `pixFmt`, `width`, `height`, `align`): `number`

Defined in: [src/lib/utilities.ts:351](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L351)

Copy image to buffer.

Copies image data from separate planes to a single contiguous buffer.

Direct mapping to av_image_copy_to_buffer().

## Parameters

### dst

`Buffer`

Destination buffer

### dstSize

`number`

Destination buffer size

### srcData

Source data planes

`null` | `Buffer`\<`ArrayBufferLike`\>[]

### srcLinesize

Source bytes per line

`null` | `number`[]

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

Bytes written, or negative AVERROR

## Example

```typescript
const buffer = Buffer.alloc(bufferSize);
const written = avImageCopyToBuffer(
  buffer, bufferSize,
  srcPlanes, srcStrides,
  AV_PIX_FMT_YUV420P, 1920, 1080, 1
);
```
