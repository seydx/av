[node-av](../globals.md) / avGetPackedSampleFmt

# Function: avGetPackedSampleFmt()

> **avGetPackedSampleFmt**(`sampleFmt`): `AVSampleFormat`

Defined in: [src/lib/utilities.ts:74](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L74)

Get packed sample format.

Returns the packed (interleaved) version of a planar sample format,
or the format itself if already packed.

Direct mapping to av_get_packed_sample_fmt().

## Parameters

### sampleFmt

`AVSampleFormat`

Audio sample format

## Returns

`AVSampleFormat`

Packed version of the format

## Example

```typescript
import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_FLT } from 'node-av/constants';

const packed = avGetPackedSampleFmt(AV_SAMPLE_FMT_FLTP); // Returns AV_SAMPLE_FMT_FLT
const same = avGetPackedSampleFmt(AV_SAMPLE_FMT_FLT);    // Returns AV_SAMPLE_FMT_FLT
```

## See

[avGetPlanarSampleFmt](avGetPlanarSampleFmt.md) For getting planar version
