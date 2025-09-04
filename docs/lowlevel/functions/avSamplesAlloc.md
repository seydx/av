[node-av](../globals.md) / avSamplesAlloc

# Function: avSamplesAlloc()

> **avSamplesAlloc**(`nbChannels`, `nbSamples`, `sampleFmt`, `align`): `object`

Defined in: [src/lib/utilities.ts:578](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L578)

Allocate audio samples buffer.

Allocates buffers for audio samples with the specified format.

Direct mapping to av_samples_alloc().

## Parameters

### nbChannels

`number`

Number of audio channels

### nbSamples

`number`

Number of samples per channel

### sampleFmt

`AVSampleFormat`

Sample format

### align

`number`

Buffer alignment

## Returns

`object`

Object with data buffers, line size, and total size

### data

> **data**: `Buffer`\<`ArrayBufferLike`\>[]

### linesize

> **linesize**: `number`

### size

> **size**: `number`

## Throws

If allocation fails

## Example

```typescript
import { AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

const { data, linesize, size } = avSamplesAlloc(
  2, 1024, AV_SAMPLE_FMT_FLTP, 0
);
console.log(`Allocated ${data.length} buffers, ${size} bytes total`);
```

## See

[avSamplesGetBufferSize](avSamplesGetBufferSize.md) To calculate size without allocating
