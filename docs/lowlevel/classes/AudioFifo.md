[node-av](../globals.md) / AudioFifo

# Class: AudioFifo

Defined in: [src/lib/audio-fifo.ts:44](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L44)

Audio FIFO (First-In-First-Out) buffer for managing audio samples.

Provides a thread-safe buffer for audio sample data, supporting both planar and interleaved formats.
Automatically handles buffer reallocation when needed. Essential for audio resampling,
format conversion, and buffering operations.

Direct mapping to FFmpeg's AVAudioFifo.

## Example

```typescript
import { AudioFifo, FFmpegError } from 'node-av';
import { AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

// Create FIFO for stereo float planar audio
const fifo = new AudioFifo();
fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);

// Write samples
const leftChannel = Buffer.alloc(1024 * 4);  // 1024 float samples
const rightChannel = Buffer.alloc(1024 * 4);
const written = await fifo.write([leftChannel, rightChannel], 1024);
FFmpegError.throwIfError(written, 'write');

// Read samples when enough available
if (fifo.size >= 512) {
  const outLeft = Buffer.alloc(512 * 4);
  const outRight = Buffer.alloc(512 * 4);
  const read = await fifo.read([outLeft, outRight], 512);
  FFmpegError.throwIfError(read, 'read');
}

// Cleanup
fifo.free();
```

## See

\[AudioFifo\](https://ffmpeg.org/doxygen/trunk/structAVAudioFifo.html)

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeAudioFifo`\>

## Constructors

### Constructor

> **new AudioFifo**(): `AudioFifo`

Defined in: [src/lib/audio-fifo.ts:47](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L47)

#### Returns

`AudioFifo`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [src/lib/audio-fifo.ts:56](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L56)

Number of samples currently in the FIFO.

Direct mapping to av_audio_fifo_size().

##### Returns

`number`

***

### space

#### Get Signature

> **get** **space**(): `number`

Defined in: [src/lib/audio-fifo.ts:65](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L65)

Number of samples that can be written without reallocation.

Direct mapping to av_audio_fifo_space().

##### Returns

`number`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/audio-fifo.ts:335](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L335)

Dispose of the audio FIFO buffer.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using fifo = new AudioFifo();
  fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);
  // Use fifo...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(`sampleFmt`, `channels`, `nbSamples`): `void`

Defined in: [src/lib/audio-fifo.ts:100](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L100)

Allocate an AVAudioFifo buffer.

Creates a FIFO buffer for the specified audio format and size.
The FIFO will automatically grow if more data is written than allocated.

Direct mapping to av_audio_fifo_alloc().

#### Parameters

##### sampleFmt

`AVSampleFormat`

Sample format (e.g., AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP)

##### channels

`number`

Number of audio channels

##### nbSamples

`number`

Initial buffer size in samples

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
import { AudioFifo } from 'node-av';
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

// For interleaved 16-bit stereo
const fifo1 = new AudioFifo();
fifo1.alloc(AV_SAMPLE_FMT_S16, 2, 4096);

// For planar float 5.1 audio
const fifo2 = new AudioFifo();
fifo2.alloc(AV_SAMPLE_FMT_FLTP, 6, 8192);
```

#### See

 - [realloc](#realloc) To resize the FIFO
 - [free](#free) To release the FIFO

***

### drain()

> **drain**(`nbSamples`): `void`

Defined in: [src/lib/audio-fifo.ts:254](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L254)

Remove samples from the FIFO without reading them.

Discards the specified number of samples from the FIFO.
Useful for skipping unwanted audio data.

Direct mapping to av_audio_fifo_drain().

#### Parameters

##### nbSamples

`number`

Number of samples to discard

#### Returns

`void`

#### Example

```typescript
// Skip 100 samples
fifo.drain(100);
console.log(`FIFO now has ${fifo.size} samples`);
```

#### See

[reset](#reset) To remove all samples

***

### free()

> **free**(): `void`

Defined in: [src/lib/audio-fifo.ts:120](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L120)

Free the FIFO buffer and all associated resources.

After calling this, the FIFO is invalid and must be reallocated before use.

Direct mapping to av_audio_fifo_free().

#### Returns

`void`

#### Example

```typescript
fifo.free();
// FIFO is now invalid, must call alloc() before using again
```

#### See

 - Symbol.dispose For automatic cleanup
 - [alloc](#alloc) To allocate

***

### getNative()

> **getNative**(): `NativeAudioFifo`

Defined in: [src/lib/audio-fifo.ts:316](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L316)

**`Internal`**

Get the underlying native AudioFifo object.

#### Returns

`NativeAudioFifo`

The native AudioFifo binding object

#### Implementation of

`NativeWrapper.getNative`

***

### peek()

> **peek**(`data`, `nbSamples`): `Promise`\<`number`\>

Defined in: [src/lib/audio-fifo.ts:231](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L231)

Read samples from the FIFO without removing them.

Similar to read() but leaves the samples in the FIFO.
Useful for inspecting upcoming data without consuming it.

Direct mapping to av_audio_fifo_peek().

#### Parameters

##### data

Pre-allocated buffer(s) to peek into. Array for planar, single Buffer for interleaved

`Buffer`\<`ArrayBufferLike`\> | `Buffer`\<`ArrayBufferLike`\>[]

##### nbSamples

`number`

Maximum number of samples to peek

#### Returns

`Promise`\<`number`\>

Number of samples peeked, or negative AVERROR:
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Peek at next samples without removing them
const peekBuffer = Buffer.alloc(256 * 4);
const peeked = await fifo.peek(peekBuffer, 256);
FFmpegError.throwIfError(peeked, 'peek');

// Samples are still in FIFO
console.log(`FIFO still has ${fifo.size} samples`);
```

#### See

[read](#read) To read and remove samples

***

### read()

> **read**(`data`, `nbSamples`): `Promise`\<`number`\>

Defined in: [src/lib/audio-fifo.ts:198](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L198)

Read and remove samples from the FIFO.

Reads up to the specified number of samples from the FIFO.
The samples are removed from the FIFO after reading.
Buffers must be pre-allocated with sufficient size.

Direct mapping to av_audio_fifo_read().

#### Parameters

##### data

Pre-allocated buffer(s) to read into. Array for planar, single Buffer for interleaved

`Buffer`\<`ArrayBufferLike`\> | `Buffer`\<`ArrayBufferLike`\>[]

##### nbSamples

`number`

Maximum number of samples to read

#### Returns

`Promise`\<`number`\>

Number of samples read, or negative AVERROR:
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Check available samples
const available = fifo.size;
if (available >= 1024) {
  // Planar format
  const leftOut = Buffer.alloc(1024 * 4);
  const rightOut = Buffer.alloc(1024 * 4);
  const read = await fifo.read([leftOut, rightOut], 1024);
  FFmpegError.throwIfError(read, 'read');
  console.log(`Read ${read} samples`);
}
```

#### See

 - [peek](#peek) To read without removing
 - [size](#size) To check available samples

***

### realloc()

> **realloc**(`nbSamples`): `number`

Defined in: [src/lib/audio-fifo.ts:305](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L305)

Resize the FIFO buffer.

Changes the allocated size of the FIFO. Can grow or shrink the buffer.
Existing samples are preserved up to the new size.

Direct mapping to av_audio_fifo_realloc().

#### Parameters

##### nbSamples

`number`

New allocation size in samples

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid size
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Grow FIFO to handle larger buffers
const ret = fifo.realloc(16384);
FFmpegError.throwIfError(ret, 'realloc');
console.log(`New space: ${fifo.space} samples`);
```

#### See

[alloc](#alloc) For initial allocation

***

### reset()

> **reset**(): `void`

Defined in: [src/lib/audio-fifo.ts:275](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L275)

Remove all samples from the FIFO.

Empties the FIFO buffer without deallocating it.
The FIFO remains allocated and ready for new data.

Direct mapping to av_audio_fifo_reset().

#### Returns

`void`

#### Example

```typescript
fifo.reset();
console.log(fifo.size);  // 0
console.log(fifo.space); // Original allocation size
```

#### See

[drain](#drain) To remove specific number of samples

***

### write()

> **write**(`data`, `nbSamples`): `Promise`\<`number`\>

Defined in: [src/lib/audio-fifo.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/audio-fifo.ts#L160)

Write audio samples to the FIFO.

Writes samples to the FIFO buffer. Automatically reallocates if more space is needed.
For planar formats, provide an array of buffers (one per channel).
For interleaved formats, provide a single buffer.

Direct mapping to av_audio_fifo_write().

#### Parameters

##### data

Audio data buffer(s). Array for planar, single Buffer for interleaved

`Buffer`\<`ArrayBufferLike`\> | `Buffer`\<`ArrayBufferLike`\>[]

##### nbSamples

`number`

Number of samples to write

#### Returns

`Promise`\<`number`\>

Number of samples written, or negative AVERROR:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Planar format (e.g., FLTP) - separate buffers per channel
const leftData = Buffer.alloc(1024 * 4);  // 1024 float samples
const rightData = Buffer.alloc(1024 * 4);
const written = await fifo.write([leftData, rightData], 1024);
FFmpegError.throwIfError(written, 'write');
console.log(`Wrote ${written} samples`);

// Interleaved format (e.g., S16) - single buffer
const interleavedData = Buffer.alloc(1024 * 2 * 2);  // 1024 stereo S16 samples
const written2 = await fifo.write(interleavedData, 1024);
FFmpegError.throwIfError(written2, 'write');
```

#### See

 - [read](#read) To retrieve samples from FIFO
 - [space](#space) To check available space
