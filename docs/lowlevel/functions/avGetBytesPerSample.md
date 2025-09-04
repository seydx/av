[node-av](../globals.md) / avGetBytesPerSample

# Function: avGetBytesPerSample()

> **avGetBytesPerSample**(`sampleFmt`): `number`

Defined in: [src/lib/utilities.ts:27](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L27)

Get bytes per audio sample.

Returns the number of bytes required to store a single audio sample
in the specified format.

Direct mapping to av_get_bytes_per_sample().

## Parameters

### sampleFmt

`AVSampleFormat`

Audio sample format

## Returns

`number`

Number of bytes per sample, or 0 if unknown format

## Example

```typescript
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

const bytesS16 = avGetBytesPerSample(AV_SAMPLE_FMT_S16);  // Returns 2
const bytesFloat = avGetBytesPerSample(AV_SAMPLE_FMT_FLTP); // Returns 4
```
