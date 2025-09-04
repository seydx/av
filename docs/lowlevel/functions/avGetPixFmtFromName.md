[node-av](../globals.md) / avGetPixFmtFromName

# Function: avGetPixFmtFromName()

> **avGetPixFmtFromName**(`name`): `AVPixelFormat`

Defined in: [src/lib/utilities.ts:165](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L165)

Get pixel format from name.

Returns the pixel format enum value from its string name.

Direct mapping to av_get_pix_fmt().

## Parameters

### name

`string`

Pixel format name

## Returns

`AVPixelFormat`

Pixel format enum, or AV_PIX_FMT_NONE if unknown

## Example

```typescript
const fmt1 = avGetPixFmtFromName("yuv420p"); // Returns AV_PIX_FMT_YUV420P
const fmt2 = avGetPixFmtFromName("rgb24");   // Returns AV_PIX_FMT_RGB24
const none = avGetPixFmtFromName("invalid"); // Returns AV_PIX_FMT_NONE
```
