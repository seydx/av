[node-av](../globals.md) / avGetPlanarSampleFmt

# Function: avGetPlanarSampleFmt()

> **avGetPlanarSampleFmt**(`sampleFmt`): `AVSampleFormat`

Defined in: [src/lib/utilities.ts:99](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L99)

Get planar sample format.

Returns the planar (non-interleaved) version of a packed sample format,
or the format itself if already planar.

Direct mapping to av_get_planar_sample_fmt().

## Parameters

### sampleFmt

`AVSampleFormat`

Audio sample format

## Returns

`AVSampleFormat`

Planar version of the format

## Example

```typescript
import { AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

const planar = avGetPlanarSampleFmt(AV_SAMPLE_FMT_FLT);   // Returns AV_SAMPLE_FMT_FLTP
const same = avGetPlanarSampleFmt(AV_SAMPLE_FMT_FLTP);    // Returns AV_SAMPLE_FMT_FLTP
```

## See

[avGetPackedSampleFmt](avGetPackedSampleFmt.md) For getting packed version
