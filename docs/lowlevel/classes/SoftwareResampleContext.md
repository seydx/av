[node-av](../globals.md) / SoftwareResampleContext

# Class: SoftwareResampleContext

Defined in: [src/lib/software-resample-context.ts:62](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L62)

Audio resampling and format conversion context.

Provides comprehensive audio format conversion including sample rate conversion,
channel layout remapping, and sample format conversion. Essential for audio
processing pipelines where format compatibility is required between components.
Supports high-quality resampling algorithms with configurable parameters.

Direct mapping to FFmpeg's SwrContext.

## Example

```typescript
import { SoftwareResampleContext, Frame, FFmpegError } from 'node-av';
import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from 'node-av/constants';

// Create resampler
const resampler = new SoftwareResampleContext();

// Configure format conversion
const outLayout = { nbChannels: 2, order: 1, u: { mask: 3n } }; // Stereo
const inLayout = { nbChannels: 1, order: 1, u: { mask: 1n } };  // Mono

const ret = resampler.allocSetOpts2(
  outLayout, AV_SAMPLE_FMT_S16, 48000,  // Output: Stereo, 16-bit, 48kHz
  inLayout, AV_SAMPLE_FMT_FLTP, 44100   // Input: Mono, float, 44.1kHz
);
FFmpegError.throwIfError(ret, 'allocSetOpts2');

const ret2 = resampler.init();
FFmpegError.throwIfError(ret2, 'init');

// Convert audio frame
const outFrame = new Frame();
outFrame.nbSamples = 1024;
outFrame.format = AV_SAMPLE_FMT_S16;
outFrame.channelLayout = outLayout;
outFrame.sampleRate = 48000;
outFrame.allocBuffer();

const ret3 = resampler.convertFrame(outFrame, inFrame);
FFmpegError.throwIfError(ret3, 'convertFrame');

// Get conversion delay
const delay = resampler.getDelay(48000n);
console.log(`Resampler delay: ${delay} samples`);

// Clean up
resampler.free();
```

## See

 - \[SwrContext\](https://ffmpeg.org/doxygen/trunk/structSwrContext.html)
 - [Frame](Frame.md) For audio frame operations

## Extends

- `OptionMember`\<`NativeSoftwareResampleContext`\>

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeSoftwareResampleContext`\>

## Constructors

### Constructor

> **new SoftwareResampleContext**(): `SoftwareResampleContext`

Defined in: [src/lib/software-resample-context.ts:63](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L63)

#### Returns

`SoftwareResampleContext`

#### Overrides

`OptionMember<NativeSoftwareResampleContext>.constructor`

## Properties

### native

> `protected` **native**: `NativeSoftwareResampleContext`

Defined in: [src/lib/option.ts:733](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L733)

#### Inherited from

`OptionMember.native`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/software-resample-context.ts:554](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L554)

Dispose of the resampler context.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using resampler = new SoftwareResampleContext();
  resampler.allocSetOpts2(...);
  resampler.init();
  // Use resampler...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(): `void`

Defined in: [src/lib/software-resample-context.ts:84](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L84)

Allocate resample context.

Allocates memory for the resampler.
Must be called before configuration.

Direct mapping to swr_alloc().

#### Returns

`void`

#### Example

```typescript
const resampler = new SoftwareResampleContext();
resampler.alloc();
// Now configure with setOption() or allocSetOpts2()
```

#### See

[allocSetOpts2](#allocsetopts2) For combined allocation and configuration

***

### allocSetOpts2()

> **allocSetOpts2**(`outChLayout`, `outSampleFmt`, `outSampleRate`, `inChLayout`, `inSampleFmt`, `inSampleRate`): `number`

Defined in: [src/lib/software-resample-context.ts:126](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L126)

Allocate and configure resampler.

Combined allocation and configuration of the resampler with
input and output format specifications.

Direct mapping to swr_alloc_set_opts2().

#### Parameters

##### outChLayout

[`ChannelLayout`](../interfaces/ChannelLayout.md)

Output channel layout

##### outSampleFmt

`AVSampleFormat`

Output sample format

##### outSampleRate

`number`

Output sample rate in Hz

##### inChLayout

[`ChannelLayout`](../interfaces/ChannelLayout.md)

Input channel layout

##### inSampleFmt

`AVSampleFormat`

Input sample format

##### inSampleRate

`number`

Input sample rate in Hz

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from 'node-av/constants';

// Stereo layout
const stereo = { nbChannels: 2, order: 1, u: { mask: 3n } };
// 5.1 layout
const surround = { nbChannels: 6, order: 1, u: { mask: 63n } };

// Convert 5.1 float to stereo 16-bit
const ret = resampler.allocSetOpts2(
  stereo, AV_SAMPLE_FMT_S16, 48000,
  surround, AV_SAMPLE_FMT_FLTP, 48000
);
FFmpegError.throwIfError(ret, 'allocSetOpts2');
```

#### See

[init](#init) Must be called after configuration

***

### close()

> **close**(): `void`

Defined in: [src/lib/software-resample-context.ts:201](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L201)

Close resampler context.

Closes the resampler but keeps the context allocated.
Can be reconfigured and reinitialized after closing.

Direct mapping to swr_close().

#### Returns

`void`

#### Example

```typescript
resampler.close();
// Can now reconfigure and reinit
```

#### See

[free](#free) For complete deallocation

***

### configFrame()

> **configFrame**(`outFrame`, `inFrame`): `number`

Defined in: [src/lib/software-resample-context.ts:312](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L312)

Configure resampler from frames.

Configures the resampler using format information from frames.
Alternative to allocSetOpts2() for frame-based setup.

Direct mapping to swr_config_frame().

#### Parameters

##### outFrame

Frame with output format

`null` | [`Frame`](Frame.md)

##### inFrame

Frame with input format

`null` | [`Frame`](Frame.md)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Configure from frames
const ret = resampler.configFrame(outFrame, inFrame);
FFmpegError.throwIfError(ret, 'configFrame');

const ret2 = resampler.init();
FFmpegError.throwIfError(ret2, 'init');
```

#### See

[allocSetOpts2](#allocsetopts2) For manual configuration

***

### convert()

> **convert**(`outBuffer`, `outCount`, `inBuffer`, `inCount`): `Promise`\<`number`\>

Defined in: [src/lib/software-resample-context.ts:242](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L242)

Convert audio samples.

Converts audio samples from input format to output format.
Handles resampling, channel remapping, and format conversion.

Direct mapping to swr_convert().

#### Parameters

##### outBuffer

Output sample buffers (one per channel for planar)

`null` | `Buffer`\<`ArrayBufferLike`\>[]

##### outCount

`number`

Maximum output samples per channel

##### inBuffer

Input sample buffers (one per channel for planar)

`null` | `Buffer`\<`ArrayBufferLike`\>[]

##### inCount

`number`

Input samples per channel

#### Returns

`Promise`\<`number`\>

Number of output samples per channel, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_INPUT_CHANGED: Input format changed

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Convert audio buffers
const outBuffers = [Buffer.alloc(4096), Buffer.alloc(4096)]; // Stereo
const inBuffers = [inputBuffer]; // Mono

const samples = await resampler.convert(
  outBuffers, 1024,
  inBuffers, inputSamples
);

if (samples < 0) {
  FFmpegError.throwIfError(samples, 'convert');
}
console.log(`Converted ${samples} samples`);
```

#### See

[convertFrame](#convertframe) For frame-based conversion

***

### convertFrame()

> **convertFrame**(`outFrame`, `inFrame`): `number`

Defined in: [src/lib/software-resample-context.ts:281](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L281)

Convert audio frame.

Converts an entire audio frame to the output format.
Simpler interface than convert() for frame-based processing.

Direct mapping to swr_convert_frame().

#### Parameters

##### outFrame

Output frame (null to drain)

`null` | [`Frame`](Frame.md)

##### inFrame

Input frame (null to flush)

`null` | [`Frame`](Frame.md)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_INPUT_CHANGED: Input format changed

#### Example

```typescript
import { Frame, FFmpegError } from 'node-av';

// Convert frame
const outFrame = new Frame();
const ret = resampler.convertFrame(outFrame, inFrame);
FFmpegError.throwIfError(ret, 'convertFrame');

// Drain remaining samples
const drainFrame = new Frame();
const ret2 = resampler.convertFrame(drainFrame, null);
if (ret2 === 0) {
  // Got drained samples
}
```

#### See

 - [convert](#convert) For buffer-based conversion
 - [configFrame](#configframe) To configure from frame

***

### dropOutput()

> **dropOutput**(`count`): `number`

Defined in: [src/lib/software-resample-context.ts:499](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L499)

Drop output samples.

Drops the specified number of output samples.
Used for synchronization adjustments.

Direct mapping to swr_drop_output().

#### Parameters

##### count

`number`

Number of samples to drop

#### Returns

`number`

0 on success, negative AVERROR on error

#### Example

```typescript
// Drop 100 output samples
const ret = resampler.dropOutput(100);
if (ret >= 0) {
  console.log(`Dropped ${ret} samples`);
}
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/software-resample-context.ts:181](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L181)

Free resampler context.

Releases all resources associated with the resampler.
The context becomes invalid after calling this.

Direct mapping to swr_free().

#### Returns

`void`

#### Example

```typescript
resampler.free();
// Resampler is now invalid
```

#### See

 - [close](#close) For closing without freeing
 - Symbol.dispose For automatic cleanup

***

### getDelay()

> **getDelay**(`base`): `bigint`

Defined in: [src/lib/software-resample-context.ts:360](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L360)

Get resampler delay.

Returns the number of samples currently buffered in the resampler.
These samples will be output when flushing or with new input.

Direct mapping to swr_get_delay().

#### Parameters

##### base

`bigint`

Time base for the returned delay

#### Returns

`bigint`

Delay in samples at the given base rate

#### Example

```typescript
// Get delay in output sample rate
const delay = resampler.getDelay(48000n);
console.log(`${delay} samples buffered`);

// Get delay in microseconds
const delayUs = resampler.getDelay(1000000n);
console.log(`${delayUs} microseconds delay`);
```

***

### getNative()

> **getNative**(): `NativeSoftwareResampleContext`

Defined in: [src/lib/software-resample-context.ts:534](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L534)

**`Internal`**

Get the underlying native SoftwareResampleContext object.

#### Returns

`NativeSoftwareResampleContext`

The native SoftwareResampleContext binding object

#### Implementation of

`NativeWrapper.getNative`

***

### getOption()

Get an option value from this object.

Uses the AVOption API to retrieve options.

Direct mapping to av_opt_get* functions.

#### Param

Option name

#### Param

Option type (defaults to AV_OPT_TYPE_STRING)

#### Param

Search flags (default: AV_OPT_SEARCH_CHILDREN)

#### Example

```typescript
import { AV_OPT_TYPE_STRING, AV_OPT_TYPE_RATIONAL, AV_OPT_TYPE_PIXEL_FMT, AV_OPT_TYPE_INT64 } from 'node-av/constants';

// String options (default)
const preset = obj.getOption('preset');
const codec = obj.getOption('codec', AV_OPT_TYPE_STRING);

// Typed options
const framerate = obj.getOption('framerate', AV_OPT_TYPE_RATIONAL); // Returns {num, den}
const pixFmt = obj.getOption('pix_fmt', AV_OPT_TYPE_PIXEL_FMT); // Returns AVPixelFormat
const bitrate = obj.getOption('bitrate', AV_OPT_TYPE_INT64); // Returns bigint
```

#### Call Signature

> **getOption**(`name`, `type?`, `searchFlags?`): `null` \| `string`

Defined in: [src/lib/option.ts:947](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L947)

##### Parameters

###### name

`string`

###### type?

`AVOptionTypeString`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `string`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `string`

Defined in: [src/lib/option.ts:948](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L948)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeColor`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `string`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `number`

Defined in: [src/lib/option.ts:951](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L951)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeInt`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `number`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `bigint`

Defined in: [src/lib/option.ts:952](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L952)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeInt64`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `bigint`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `number`

Defined in: [src/lib/option.ts:953](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L953)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeUint`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `number`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `bigint`

Defined in: [src/lib/option.ts:954](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L954)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeUint64`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `bigint`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `number`

Defined in: [src/lib/option.ts:955](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L955)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeFlags`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `number`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `boolean`

Defined in: [src/lib/option.ts:956](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L956)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeBool`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `boolean`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `number`

Defined in: [src/lib/option.ts:957](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L957)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeDuration`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `number`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `number`

Defined in: [src/lib/option.ts:958](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L958)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeConst`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `number`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `number`

Defined in: [src/lib/option.ts:961](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L961)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeDouble`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `number`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `number`

Defined in: [src/lib/option.ts:962](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L962)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeFloat`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `number`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| [`IRational`](../interfaces/IRational.md)

Defined in: [src/lib/option.ts:965](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L965)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeRational`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| [`IRational`](../interfaces/IRational.md)

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| [`IRational`](../interfaces/IRational.md)

Defined in: [src/lib/option.ts:966](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L966)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeVideoRate`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| [`IRational`](../interfaces/IRational.md)

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `AVPixelFormat`

Defined in: [src/lib/option.ts:967](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L967)

##### Parameters

###### name

`string`

###### type

`AVOptionTypePixelFmt`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `AVPixelFormat`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `AVSampleFormat`

Defined in: [src/lib/option.ts:968](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L968)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeSampleFmt`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `AVSampleFormat`

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| \{ `height`: `number`; `width`: `number`; \}

Defined in: [src/lib/option.ts:969](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L969)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeImageSize`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| \{ `height`: `number`; `width`: `number`; \}

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| [`ChannelLayout`](../interfaces/ChannelLayout.md)

Defined in: [src/lib/option.ts:970](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L970)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeChLayout`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| [`ChannelLayout`](../interfaces/ChannelLayout.md)

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| [`Dictionary`](Dictionary.md)

Defined in: [src/lib/option.ts:971](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L971)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeDict`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| [`Dictionary`](Dictionary.md)

##### Inherited from

`OptionMember.getOption`

#### Call Signature

> **getOption**(`name`, `type`, `searchFlags?`): `null` \| `string`

Defined in: [src/lib/option.ts:972](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L972)

##### Parameters

###### name

`string`

###### type

`AVOptionTypeBinary`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`null` \| `string`

##### Inherited from

`OptionMember.getOption`

***

### getOutSamples()

> **getOutSamples**(`inSamples`): `number`

Defined in: [src/lib/software-resample-context.ts:381](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L381)

Calculate output sample count.

Calculates how many output samples will be produced
for a given number of input samples.

Direct mapping to swr_get_out_samples().

#### Parameters

##### inSamples

`number`

Number of input samples

#### Returns

`number`

Number of output samples

#### Example

```typescript
const outSamples = resampler.getOutSamples(1024);
console.log(`1024 input samples -> ${outSamples} output samples`);
```

***

### init()

> **init**(): `number`

Defined in: [src/lib/software-resample-context.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L160)

Initialize resampler.

Initializes the resampler after configuration.
Must be called before any conversion operations.

Direct mapping to swr_init().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid configuration
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = resampler.init();
FFmpegError.throwIfError(ret, 'init');
```

#### See

 - [allocSetOpts2](#allocsetopts2) For configuration
 - [isInitialized](#isinitialized) To check initialization status

***

### injectSilence()

> **injectSilence**(`count`): `number`

Defined in: [src/lib/software-resample-context.ts:523](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L523)

Inject silence.

Injects silent samples into the output.
Used for padding or synchronization.

Direct mapping to swr_inject_silence().

#### Parameters

##### count

`number`

Number of silent samples to inject

#### Returns

`number`

0 on success, negative AVERROR on error

#### Example

```typescript
// Inject 100 silent samples
const ret = resampler.injectSilence(100);
if (ret >= 0) {
  console.log(`Injected ${ret} silent samples`);
}
```

***

### isInitialized()

> **isInitialized**(): `boolean`

Defined in: [src/lib/software-resample-context.ts:334](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L334)

Check if initialized.

Returns whether the resampler has been initialized.

Direct mapping to swr_is_initialized().

#### Returns

`boolean`

True if initialized, false otherwise

#### Example

```typescript
if (!resampler.isInitialized()) {
  resampler.init();
}
```

#### See

[init](#init) To initialize

***

### listOptions()

> **listOptions**(): [`OptionInfo`](OptionInfo.md)[]

Defined in: [src/lib/option.ts:1085](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L1085)

List all available options for this object.

Uses the AVOption API to enumerate all options.
Useful for discovering available settings and their types.

Direct mapping to av_opt_next() iteration.

#### Returns

[`OptionInfo`](OptionInfo.md)[]

Array of option information objects

#### Example

```typescript
const options = obj.listOptions();
for (const opt of options) {
  console.log(`${opt.name}: ${opt.help}`);
  console.log(`  Type: ${opt.type}, Default: ${opt.defaultValue}`);
  console.log(`  Range: ${opt.min} - ${opt.max}`);
}
```

#### See

[OptionInfo](OptionInfo.md) For option metadata structure

#### Inherited from

`OptionMember.listOptions`

***

### nextPts()

> **nextPts**(`pts`): `bigint`

Defined in: [src/lib/software-resample-context.ts:402](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L402)

Calculate next PTS.

Calculates the presentation timestamp for the next output sample.

Direct mapping to swr_next_pts().

#### Parameters

##### pts

`bigint`

Current presentation timestamp

#### Returns

`bigint`

Next presentation timestamp

#### Example

```typescript
let pts = 0n;
pts = resampler.nextPts(pts);
console.log(`Next PTS: ${pts}`);
```

***

### setChannelMapping()

> **setChannelMapping**(`channelMap`): `number`

Defined in: [src/lib/software-resample-context.ts:449](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L449)

Set channel mapping.

Sets custom channel mapping for remixing.

Direct mapping to swr_set_channel_mapping().

#### Parameters

##### channelMap

`number`[]

Array mapping input to output channels

#### Returns

`number`

0 on success, negative AVERROR on error

#### Example

```typescript
// Map stereo to reverse stereo (swap L/R)
const ret = resampler.setChannelMapping([1, 0]);
FFmpegError.throwIfError(ret, 'setChannelMapping');
```

***

### setCompensation()

> **setCompensation**(`sampleDelta`, `compensationDistance`): `number`

Defined in: [src/lib/software-resample-context.ts:428](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L428)

Set compensation.

Adjusts the resampling rate to compensate for clock drift.
Used for audio/video synchronization.

Direct mapping to swr_set_compensation().

#### Parameters

##### sampleDelta

`number`

Sample difference to compensate

##### compensationDistance

`number`

Distance over which to compensate

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Compensate 10 samples over 1000 samples
const ret = resampler.setCompensation(10, 1000);
FFmpegError.throwIfError(ret, 'setCompensation');
```

***

### setMatrix()

> **setMatrix**(`matrix`, `stride`): `number`

Defined in: [src/lib/software-resample-context.ts:475](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/software-resample-context.ts#L475)

Set mixing matrix.

Sets a custom mixing matrix for channel remapping.

Direct mapping to swr_set_matrix().

#### Parameters

##### matrix

`number`[]

Mixing matrix coefficients

##### stride

`number`

Matrix row stride

#### Returns

`number`

0 on success, negative AVERROR on error

#### Example

```typescript
// Custom downmix matrix
const matrix = [
  1.0, 0.0,  // Left channel
  0.0, 1.0,  // Right channel
];
const ret = resampler.setMatrix(matrix, 2);
FFmpegError.throwIfError(ret, 'setMatrix');
```

***

### setOption()

Set an option on this object.

Uses the AVOption API to set options.
Available options depend on the specific object type.

Direct mapping to av_opt_set* functions.

#### Param

Option name

#### Param

Option value

#### Param

Option type (defaults to AV_OPT_TYPE_STRING)

#### Param

Search flags (default: AV_OPT_SEARCH_CHILDREN)

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_OPT_TYPE_STRING, AV_OPT_TYPE_INT64, AV_OPT_TYPE_RATIONAL, AV_OPT_TYPE_PIXEL_FMT } from 'node-av/constants';

// String options (default)
let ret = obj.setOption('preset', 'fast');
FFmpegError.throwIfError(ret, 'set preset');

ret = obj.setOption('codec', 'h264', AV_OPT_TYPE_STRING);
FFmpegError.throwIfError(ret, 'set codec');

// Integer options
ret = obj.setOption('bitrate', 2000000, AV_OPT_TYPE_INT64);
FFmpegError.throwIfError(ret, 'set bitrate');

ret = obj.setOption('threads', 4, AV_OPT_TYPE_INT);
FFmpegError.throwIfError(ret, 'set threads');

// Complex types with proper types
ret = obj.setOption('framerate', {num: 30, den: 1}, AV_OPT_TYPE_RATIONAL);
FFmpegError.throwIfError(ret, 'set framerate');

ret = obj.setOption('pix_fmt', AV_PIX_FMT_YUV420P, AV_OPT_TYPE_PIXEL_FMT);
FFmpegError.throwIfError(ret, 'set pixel format');
```

#### Call Signature

> **setOption**(`name`, `value`, `type?`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:740](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L740)

##### Parameters

###### name

`string`

###### value

`string`

###### type?

`AVOptionTypeString`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:741](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L741)

##### Parameters

###### name

`string`

###### value

`string`

###### type

`AVOptionTypeColor`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:744](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L744)

##### Parameters

###### name

`string`

###### value

`number`

###### type

`AVOptionTypeInt`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:745](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L745)

##### Parameters

###### name

`string`

###### value

`bigint`

###### type

`AVOptionTypeInt64`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:746](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L746)

##### Parameters

###### name

`string`

###### value

`number`

###### type

`AVOptionTypeUint`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:747](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L747)

##### Parameters

###### name

`string`

###### value

`bigint`

###### type

`AVOptionTypeUint64`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:748](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L748)

##### Parameters

###### name

`string`

###### value

`number`

###### type

`AVOptionTypeFlags`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:749](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L749)

##### Parameters

###### name

`string`

###### value

`boolean`

###### type

`AVOptionTypeBool`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:750](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L750)

##### Parameters

###### name

`string`

###### value

`number`

###### type

`AVOptionTypeDuration`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:751](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L751)

##### Parameters

###### name

`string`

###### value

`number`

###### type

`AVOptionTypeConst`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:754](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L754)

##### Parameters

###### name

`string`

###### value

`number`

###### type

`AVOptionTypeDouble`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:755](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L755)

##### Parameters

###### name

`string`

###### value

`number`

###### type

`AVOptionTypeFloat`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:758](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L758)

##### Parameters

###### name

`string`

###### value

[`IRational`](../interfaces/IRational.md)

###### type

`AVOptionTypeRational`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:759](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L759)

##### Parameters

###### name

`string`

###### value

[`IRational`](../interfaces/IRational.md)

###### type

`AVOptionTypeVideoRate`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:760](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L760)

##### Parameters

###### name

`string`

###### value

`AVPixelFormat`

###### type

`AVOptionTypePixelFmt`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:761](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L761)

##### Parameters

###### name

`string`

###### value

`AVSampleFormat`

###### type

`AVOptionTypeSampleFmt`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:762](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L762)

##### Parameters

###### name

`string`

###### value

###### height

`number`

###### width

`number`

###### type

`AVOptionTypeImageSize`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:763](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L763)

##### Parameters

###### name

`string`

###### value

`number` | `bigint`

###### type

`AVOptionTypeChLayout`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:764](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L764)

##### Parameters

###### name

`string`

###### value

`Buffer`

###### type

`AVOptionTypeBinary`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:765](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L765)

##### Parameters

###### name

`string`

###### value

`number`[]

###### type

`AVOptionTypeBinaryIntArray`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`

#### Call Signature

> **setOption**(`name`, `value`, `type`, `searchFlags?`): `number`

Defined in: [src/lib/option.ts:766](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L766)

##### Parameters

###### name

`string`

###### value

[`Dictionary`](Dictionary.md)

###### type

`AVOptionTypeDict`

###### searchFlags?

`AVOptionSearchFlags`

##### Returns

`number`

##### Inherited from

`OptionMember.setOption`
