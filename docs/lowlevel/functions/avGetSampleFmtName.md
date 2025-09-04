[node-av](../globals.md) / avGetSampleFmtName

# Function: avGetSampleFmtName()

> **avGetSampleFmtName**(`sampleFmt`): `null` \| `string`

Defined in: [src/lib/utilities.ts:49](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L49)

Get sample format name.

Returns the name of the audio sample format as a string.

Direct mapping to av_get_sample_fmt_name().

## Parameters

### sampleFmt

`AVSampleFormat`

Audio sample format

## Returns

`null` \| `string`

Format name, or null if unknown

## Example

```typescript
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

const name1 = avGetSampleFmtName(AV_SAMPLE_FMT_S16);  // Returns "s16"
const name2 = avGetSampleFmtName(AV_SAMPLE_FMT_FLTP); // Returns "fltp"
```
