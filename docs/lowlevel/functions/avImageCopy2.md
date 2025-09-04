[node-av](../globals.md) / avImageCopy2

# Function: avImageCopy2()

> **avImageCopy2**(`dstData`, `dstLinesizes`, `srcData`, `srcLinesizes`, `pixFmt`, `width`, `height`): `void`

Defined in: [src/lib/utilities.ts:285](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L285)

Copy image data.

Copies image data from source to destination buffers.

Direct mapping to av_image_copy2().

## Parameters

### dstData

`Buffer`\<`ArrayBufferLike`\>[]

Destination data planes

### dstLinesizes

`number`[]

Destination bytes per line

### srcData

`Buffer`\<`ArrayBufferLike`\>[]

Source data planes

### srcLinesizes

`number`[]

Source bytes per line

### pixFmt

`AVPixelFormat`

Pixel format

### width

`number`

Image width

### height

`number`

Image height

## Returns

`void`

## Example

```typescript
avImageCopy2(
  dstPlanes, dstStrides,
  srcPlanes, srcStrides,
  AV_PIX_FMT_YUV420P, 1920, 1080
);
```
