[node-av](../globals.md) / avSamplesGetBufferSize

# Function: avSamplesGetBufferSize()

> **avSamplesGetBufferSize**(`nbChannels`, `nbSamples`, `sampleFmt`, `align`): `object`

Defined in: [src/lib/utilities.ts:622](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L622)

Get audio samples buffer size.

Calculates the required buffer size for audio samples.

Direct mapping to av_samples_get_buffer_size().

## Parameters

### nbChannels

`number`

Number of channels

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

Object with size and line size

### linesize

> **linesize**: `number`

### size

> **size**: `number`

## Throws

If parameters are invalid

## Example

```typescript
import { AV_SAMPLE_FMT_S16 } from 'node-av/constants';

const { size, linesize } = avSamplesGetBufferSize(
  2, 1024, AV_SAMPLE_FMT_S16, 0
);
console.log(`Need ${size} bytes, ${linesize} per channel`);
```

## See

[avSamplesAlloc](avSamplesAlloc.md) To allocate the buffer
