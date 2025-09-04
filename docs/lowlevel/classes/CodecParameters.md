[node-av](../globals.md) / CodecParameters

# Class: CodecParameters

Defined in: [src/lib/codec-parameters.ts:57](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L57)

Codec parameters for stream configuration.

Stores essential codec parameters without requiring a full codec context.
Used to describe stream properties in containers, transfer codec configuration
between contexts, and initialize decoders/encoders. Contains format, dimensions,
sample rates, and other codec-specific parameters.

Direct mapping to FFmpeg's AVCodecParameters.

## Example

```typescript
import { CodecParameters, CodecContext, FFmpegError } from 'node-av';

// Create and allocate parameters
const params = new CodecParameters();
params.alloc();

// Copy from stream
const stream = formatContext.streams[0];
const ret = stream.codecpar.copy(params);
FFmpegError.throwIfError(ret, 'copy');

// Transfer to codec context
const ret2 = params.toContext(codecContext);
FFmpegError.throwIfError(ret2, 'toContext');

// Get parameters info
console.log(`Codec: ${params.codecId}`);
console.log(`Dimensions: ${params.width}x${params.height}`);
console.log(`Bitrate: ${params.bitRate}`);
```

## See

 - \[AVCodecParameters\](https://ffmpeg.org/doxygen/trunk/structAVCodecParameters.html)
 - [CodecContext](CodecContext.md) For full codec operations
 - [Stream](Stream.md) For stream parameters

## Implements

- `NativeWrapper`\<`NativeCodecParameters`\>

## Constructors

### Constructor

> **new CodecParameters**(): `CodecParameters`

Defined in: [src/lib/codec-parameters.ts:60](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L60)

#### Returns

`CodecParameters`

## Accessors

### bitRate

#### Get Signature

> **get** **bitRate**(): `bigint`

Defined in: [src/lib/codec-parameters.ts:157](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L157)

Bit rate.

Average bitrate in bits per second.

Direct mapping to AVCodecParameters->bit_rate.

##### Returns

`bigint`

#### Set Signature

> **set** **bitRate**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:161](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L161)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### channelLayout

#### Get Signature

> **get** **channelLayout**(): [`ChannelLayout`](../interfaces/ChannelLayout.md)

Defined in: [src/lib/codec-parameters.ts:339](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L339)

Audio channel layout.

Configuration of audio channels.

Direct mapping to AVCodecParameters->ch_layout.

##### Returns

[`ChannelLayout`](../interfaces/ChannelLayout.md)

#### Set Signature

> **set** **channelLayout**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:343](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L343)

##### Parameters

###### value

[`ChannelLayout`](../interfaces/ChannelLayout.md)

##### Returns

`void`

***

### channels

#### Get Signature

> **get** **channels**(): `number`

Defined in: [src/lib/codec-parameters.ts:354](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L354)

Number of audio channels.

##### Deprecated

Use channelLayout.nbChannels instead

Direct mapping to AVCodecParameters->channels.

##### Returns

`number`

#### Set Signature

> **set** **channels**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:358](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L358)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### chromaLocation

#### Get Signature

> **get** **chromaLocation**(): `AVChromaLocation`

Defined in: [src/lib/codec-parameters.ts:324](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L324)

Chroma sample location.

Location of chroma samples.

Direct mapping to AVCodecParameters->chroma_location.

##### Returns

`AVChromaLocation`

#### Set Signature

> **set** **chromaLocation**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:328](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L328)

##### Parameters

###### value

`AVChromaLocation`

##### Returns

`void`

***

### codecId

#### Get Signature

> **get** **codecId**(): `AVCodecID`

Defined in: [src/lib/codec-parameters.ts:86](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L86)

Codec ID.

Specific codec identifier (e.g., AV_CODEC_ID_H264).

Direct mapping to AVCodecParameters->codec_id.

##### Returns

`AVCodecID`

#### Set Signature

> **set** **codecId**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:90](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L90)

##### Parameters

###### value

`AVCodecID`

##### Returns

`void`

***

### codecTag

#### Get Signature

> **get** **codecTag**(): `number`

Defined in: [src/lib/codec-parameters.ts:101](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L101)

Codec tag.

Additional codec tag used by some formats.

Direct mapping to AVCodecParameters->codec_tag.

##### Returns

`number`

#### Set Signature

> **set** **codecTag**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:105](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L105)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### codecType

#### Get Signature

> **get** **codecType**(): `AVMediaType`

Defined in: [src/lib/codec-parameters.ts:71](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L71)

Codec type.

Media type (video, audio, subtitle, etc.).

Direct mapping to AVCodecParameters->codec_type.

##### Returns

`AVMediaType`

#### Set Signature

> **set** **codecType**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:75](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L75)

##### Parameters

###### value

`AVMediaType`

##### Returns

`void`

***

### colorPrimaries

#### Get Signature

> **get** **colorPrimaries**(): `AVColorPrimaries`

Defined in: [src/lib/codec-parameters.ts:279](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L279)

Color primaries.

Chromaticity coordinates of source primaries.

Direct mapping to AVCodecParameters->color_primaries.

##### Returns

`AVColorPrimaries`

#### Set Signature

> **set** **colorPrimaries**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:283](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L283)

##### Parameters

###### value

`AVColorPrimaries`

##### Returns

`void`

***

### colorRange

#### Get Signature

> **get** **colorRange**(): `AVColorRange`

Defined in: [src/lib/codec-parameters.ts:264](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L264)

Color range.

MPEG (limited) or JPEG (full) range.

Direct mapping to AVCodecParameters->color_range.

##### Returns

`AVColorRange`

#### Set Signature

> **set** **colorRange**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:268](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L268)

##### Parameters

###### value

`AVColorRange`

##### Returns

`void`

***

### colorSpace

#### Get Signature

> **get** **colorSpace**(): `AVColorSpace`

Defined in: [src/lib/codec-parameters.ts:309](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L309)

Color space.

YUV colorspace type.

Direct mapping to AVCodecParameters->color_space.

##### Returns

`AVColorSpace`

#### Set Signature

> **set** **colorSpace**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:313](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L313)

##### Parameters

###### value

`AVColorSpace`

##### Returns

`void`

***

### colorTrc

#### Get Signature

> **get** **colorTrc**(): `AVColorTransferCharacteristic`

Defined in: [src/lib/codec-parameters.ts:294](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L294)

Color transfer characteristic.

Color transfer function (gamma).

Direct mapping to AVCodecParameters->color_trc.

##### Returns

`AVColorTransferCharacteristic`

#### Set Signature

> **set** **colorTrc**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:298](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L298)

##### Parameters

###### value

`AVColorTransferCharacteristic`

##### Returns

`void`

***

### extradata

#### Get Signature

> **get** **extradata**(): `null` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [src/lib/codec-parameters.ts:116](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L116)

Extra codec data.

Codec-specific initialization data (e.g., H.264 SPS/PPS).

Direct mapping to AVCodecParameters->extradata.

##### Returns

`null` \| `Buffer`\<`ArrayBufferLike`\>

#### Set Signature

> **set** **extradata**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:120](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L120)

##### Parameters

###### value

`null` | `Buffer`\<`ArrayBufferLike`\>

##### Returns

`void`

***

### extradataSize

#### Get Signature

> **get** **extradataSize**(): `number`

Defined in: [src/lib/codec-parameters.ts:131](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L131)

Extra data size.

Size of extradata buffer in bytes.

Direct mapping to AVCodecParameters->extradata_size.

##### Returns

`number`

***

### format

#### Get Signature

> **get** **format**(): `AVPixelFormat` \| `AVSampleFormat`

Defined in: [src/lib/codec-parameters.ts:142](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L142)

Pixel or sample format.

Format of video pixels or audio samples.

Direct mapping to AVCodecParameters->format.

##### Returns

`AVPixelFormat` \| `AVSampleFormat`

#### Set Signature

> **set** **format**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:146](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L146)

##### Parameters

###### value

`AVPixelFormat` | `AVSampleFormat`

##### Returns

`void`

***

### frameRate

#### Get Signature

> **get** **frameRate**(): [`Rational`](Rational.md)

Defined in: [src/lib/codec-parameters.ts:248](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L248)

Frame rate.

Video frame rate in frames per second.

Direct mapping to AVCodecParameters->framerate.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **frameRate**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:253](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L253)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: [src/lib/codec-parameters.ts:217](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L217)

Video height.

Height of video frames in pixels.

Direct mapping to AVCodecParameters->height.

##### Returns

`number`

#### Set Signature

> **set** **height**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:221](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L221)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### level

#### Get Signature

> **get** **level**(): `number`

Defined in: [src/lib/codec-parameters.ts:187](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L187)

Codec level.

Level within the profile.

Direct mapping to AVCodecParameters->level.

##### Returns

`number`

#### Set Signature

> **set** **level**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:191](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L191)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### profile

#### Get Signature

> **get** **profile**(): `AVProfile`

Defined in: [src/lib/codec-parameters.ts:172](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L172)

Codec profile.

Profile level (e.g., baseline, main, high for H.264).

Direct mapping to AVCodecParameters->profile.

##### Returns

`AVProfile`

#### Set Signature

> **set** **profile**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:176](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L176)

##### Parameters

###### value

`AVProfile`

##### Returns

`void`

***

### sampleAspectRatio

#### Get Signature

> **get** **sampleAspectRatio**(): [`Rational`](Rational.md)

Defined in: [src/lib/codec-parameters.ts:232](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L232)

Sample aspect ratio.

Pixel aspect ratio for video.

Direct mapping to AVCodecParameters->sample_aspect_ratio.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **sampleAspectRatio**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:237](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L237)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### sampleRate

#### Get Signature

> **get** **sampleRate**(): `number`

Defined in: [src/lib/codec-parameters.ts:369](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L369)

Audio sample rate.

Sample rate in Hz.

Direct mapping to AVCodecParameters->sample_rate.

##### Returns

`number`

#### Set Signature

> **set** **sampleRate**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:373](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L373)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: [src/lib/codec-parameters.ts:202](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L202)

Video width.

Width of video frames in pixels.

Direct mapping to AVCodecParameters->width.

##### Returns

`number`

#### Set Signature

> **set** **width**(`value`): `void`

Defined in: [src/lib/codec-parameters.ts:206](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L206)

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/codec-parameters.ts:541](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L541)

Dispose of the codec parameters.

Implements the Disposable interface for automatic cleanup.

#### Returns

`void`

#### Example

```typescript
{
  using params = new CodecParameters();
  params.alloc();
  // Use params...
} // Automatically disposed when leaving scope
```

***

### alloc()

> **alloc**(): `void`

Defined in: [src/lib/codec-parameters.ts:395](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L395)

Allocate codec parameters.

Allocates memory for the parameters structure.

Direct mapping to avcodec_parameters_alloc().

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
const params = new CodecParameters();
params.alloc();
// Parameters ready for use
```

#### See

[free](#free) To deallocate

***

### copy()

> **copy**(`dst`): `number`

Defined in: [src/lib/codec-parameters.ts:440](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L440)

Copy parameters to destination.

Copies all codec parameters to another instance.

Direct mapping to avcodec_parameters_copy().

#### Parameters

##### dst

`CodecParameters`

Destination parameters

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const dst = new CodecParameters();
dst.alloc();
const ret = src.copy(dst);
FFmpegError.throwIfError(ret, 'copy');
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/codec-parameters.ts:415](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L415)

Free codec parameters.

Releases all memory associated with the parameters.

Direct mapping to avcodec_parameters_free().

#### Returns

`void`

#### Example

```typescript
params.free();
// Parameters now invalid
```

#### See

 - [alloc](#alloc) To allocate
 - Symbol.dispose For automatic cleanup

***

### fromContext()

> **fromContext**(`codecContext`): `number`

Defined in: [src/lib/codec-parameters.ts:466](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L466)

Fill parameters from codec context.

Extracts codec parameters from a configured codec context.

Direct mapping to avcodec_parameters_from_context().

#### Parameters

##### codecContext

[`CodecContext`](CodecContext.md)

Source codec context

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Extract parameters from encoder
const ret = params.fromContext(encoderContext);
FFmpegError.throwIfError(ret, 'fromContext');
```

#### See

[toContext](#tocontext) To apply to context

***

### getNative()

> **getNative**(): `NativeCodecParameters`

Defined in: [src/lib/codec-parameters.ts:523](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L523)

**`Internal`**

Get the underlying native CodecParameters object.

#### Returns

`NativeCodecParameters`

The native CodecParameters binding object

#### Implementation of

`NativeWrapper.getNative`

***

### toContext()

> **toContext**(`codecContext`): `number`

Defined in: [src/lib/codec-parameters.ts:494](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L494)

Apply parameters to codec context.

Configures a codec context with these parameters.
Essential for initializing decoders with stream parameters.

Direct mapping to avcodec_parameters_to_context().

#### Parameters

##### codecContext

[`CodecContext`](CodecContext.md)

Destination codec context

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Configure decoder with stream parameters
const stream = formatContext.streams[0];
const ret = stream.codecpar.toContext(decoderContext);
FFmpegError.throwIfError(ret, 'toContext');
```

#### See

[fromContext](#fromcontext) To extract from context

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `any`\>

Defined in: [src/lib/codec-parameters.ts:512](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parameters.ts#L512)

Convert to JSON representation.

Returns all codec parameters as a plain object.
Useful for debugging and serialization.

#### Returns

`Record`\<`string`, `any`\>

Object with all parameter values

#### Example

```typescript
const json = params.toJSON();
console.log(JSON.stringify(json, null, 2));
```
