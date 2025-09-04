[node-av](../globals.md) / avSampleFmtIsPlanar

# Function: avSampleFmtIsPlanar()

> **avSampleFmtIsPlanar**(`sampleFmt`): `boolean`

Defined in: [src/lib/utilities.ts:122](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L122)

Check if sample format is planar.

Returns whether the audio sample format stores channels in separate planes
(planar) rather than interleaved.

Direct mapping to av_sample_fmt_is_planar().

## Parameters

### sampleFmt

`AVSampleFormat`

Audio sample format to check

## Returns

`boolean`

True if planar, false if packed/interleaved

## Example

```typescript
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_S16P } from 'node-av/constants';

const isPacked = avSampleFmtIsPlanar(AV_SAMPLE_FMT_S16);  // Returns false
const isPlanar = avSampleFmtIsPlanar(AV_SAMPLE_FMT_S16P); // Returns true
```
