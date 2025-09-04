[node-av](../globals.md) / avGetPixFmtName

# Function: avGetPixFmtName()

> **avGetPixFmtName**(`pixFmt`): `null` \| `string`

Defined in: [src/lib/utilities.ts:144](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L144)

Get pixel format name.

Returns the name of the pixel format as a string.

Direct mapping to av_get_pix_fmt_name().

## Parameters

### pixFmt

`AVPixelFormat`

Pixel format

## Returns

`null` \| `string`

Format name, or null if unknown

## Example

```typescript
import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';

const name1 = avGetPixFmtName(AV_PIX_FMT_YUV420P); // Returns "yuv420p"
const name2 = avGetPixFmtName(AV_PIX_FMT_RGB24);   // Returns "rgb24"
```
