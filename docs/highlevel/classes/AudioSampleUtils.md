[node-av](../globals.md) / AudioSampleUtils

# Class: AudioSampleUtils

Defined in: [utilities/audio-sample.ts:59](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/audio-sample.ts#L59)

Audio sample buffer utilities.

Provides static methods for allocating and managing audio sample buffers.
These utilities handle the memory layout for various sample formats,
including planar formats where each channel has its own buffer.

## Example

```typescript
import { AudioSampleUtils } from 'node-av';
import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from 'node-av/constants';

// Allocate audio buffers for stereo float planar
const audio = AudioSampleUtils.alloc(2, 1024, AV_SAMPLE_FMT_FLTP, 0);
console.log(`Allocated ${audio.size} bytes`);
console.log(`${audio.data.length} buffers (one per channel)`);

// Get buffer size for packed format
const size = AudioSampleUtils.getBufferSize(2, 1024, AV_SAMPLE_FMT_S16, 0);
console.log(`S16 stereo needs ${size.size} bytes`);
```

## Methods

### alloc()

> `static` **alloc**(`nbChannels`, `nbSamples`, `sampleFmt`, `align`): [`AudioSampleAllocation`](../interfaces/AudioSampleAllocation.md)

Defined in: [utilities/audio-sample.ts:92](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/audio-sample.ts#L92)

Allocate audio sample buffers.

Allocates buffers for audio samples. For planar formats, allocates
separate buffers for each channel. For packed formats, allocates
a single interleaved buffer.
Direct mapping to av_samples_alloc()

#### Parameters

##### nbChannels

`number`

Number of audio channels

##### nbSamples

`number`

Number of samples per channel

##### sampleFmt

`AVSampleFormat`

Audio sample format

##### align

`number`

Buffer alignment (0 for default)

#### Returns

[`AudioSampleAllocation`](../interfaces/AudioSampleAllocation.md)

Allocation result with buffers and size information

#### Throws

On allocation failure

#### Example

```typescript
import { AudioSampleUtils } from 'node-av';
import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from 'node-av/constants';

// Allocate for planar format (separate buffer per channel)
const planar = AudioSampleUtils.alloc(2, 1024, AV_SAMPLE_FMT_FLTP, 0);
console.log(`Planar: ${planar.data.length} buffers`); // 2 buffers

// Allocate for packed format (single interleaved buffer)
const packed = AudioSampleUtils.alloc(2, 1024, AV_SAMPLE_FMT_S16, 0);
console.log(`Packed: ${packed.data.length} buffer`);  // 1 buffer
```

***

### getBufferSize()

> `static` **getBufferSize**(`nbChannels`, `nbSamples`, `sampleFmt`, `align`): [`AudioSampleBufferSize`](../interfaces/AudioSampleBufferSize.md)

Defined in: [utilities/audio-sample.ts:130](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/audio-sample.ts#L130)

Get required buffer size for audio samples.

Calculates the buffer size needed to store audio samples with the
given parameters. Does not allocate any memory.
Direct mapping to av_samples_get_buffer_size()

#### Parameters

##### nbChannels

`number`

Number of audio channels

##### nbSamples

`number`

Number of samples per channel

##### sampleFmt

`AVSampleFormat`

Audio sample format

##### align

`number`

Buffer alignment (0 for default)

#### Returns

[`AudioSampleBufferSize`](../interfaces/AudioSampleBufferSize.md)

Buffer size and line size information

#### Throws

On invalid parameters

#### Example

```typescript
import { AudioSampleUtils } from 'node-av';
import { AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_S16P } from 'node-av/constants';

// Calculate size for packed float (32-bit) stereo
const floatSize = AudioSampleUtils.getBufferSize(2, 1024, AV_SAMPLE_FMT_FLT, 0);
console.log(`Float stereo: ${floatSize.size} bytes total`);
console.log(`Line size: ${floatSize.linesize} bytes`);

// Calculate size for planar 16-bit stereo
const planarSize = AudioSampleUtils.getBufferSize(2, 1024, AV_SAMPLE_FMT_S16P, 0);
console.log(`S16 planar: ${planarSize.size} bytes total`);
console.log(`Per channel: ${planarSize.linesize} bytes`);
```
