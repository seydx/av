[node-av](../globals.md) / avIsHardwarePixelFormat

# Function: avIsHardwarePixelFormat()

> **avIsHardwarePixelFormat**(`pixFmt`): `boolean`

Defined in: [src/lib/utilities.ts:188](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L188)

Check if pixel format is hardware accelerated.

Returns whether the pixel format represents hardware-accelerated frames
(GPU memory) rather than software frames (system memory).

Direct mapping to av_pix_fmt_desc_get() with hwaccel check.

## Parameters

### pixFmt

`AVPixelFormat`

Pixel format to check

## Returns

`boolean`

True if hardware format, false if software format

## Example

```typescript
import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_CUDA } from 'node-av/constants';

const isSoftware = avIsHardwarePixelFormat(AV_PIX_FMT_YUV420P); // Returns false
const isHardware = avIsHardwarePixelFormat(AV_PIX_FMT_CUDA);    // Returns true
```
