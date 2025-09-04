[node-av](../globals.md) / avImageAllocArrays

# Function: avImageAllocArrays()

> **avImageAllocArrays**(`width`, `height`, `pixFmt`, `align`): `object`

Defined in: [src/lib/utilities.ts:427](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L427)

Allocate image arrays.

Allocates image data as separate plane arrays.

## Parameters

### width

`number`

Image width

### height

`number`

Image height

### pixFmt

`AVPixelFormat`

Pixel format

### align

`number`

Buffer alignment

## Returns

`object`

Object with data planes, line sizes, and total size

### data

> **data**: `Buffer`\<`ArrayBufferLike`\>[]

### linesizes

> **linesizes**: `number`[]

### size

> **size**: `number`

## Example

```typescript
const { data, linesizes, size } = avImageAllocArrays(
  1920, 1080, AV_PIX_FMT_YUV420P, 32
);
console.log(`Allocated ${data.length} planes, total ${size} bytes`);
```
