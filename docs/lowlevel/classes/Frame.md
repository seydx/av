[node-av](../globals.md) / Frame

# Class: Frame

Defined in: [src/lib/frame.ts:61](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L61)

Container for uncompressed audio/video data.

Stores decoded audio samples or video pixels. Each frame contains raw data
for a single video frame or a set of audio samples. Includes format information,
timing data, and metadata. Supports both software and hardware (GPU) frames.
Essential for decoding, encoding, and filter operations.

Direct mapping to FFmpeg's AVFrame.

## Example

```typescript
import { Frame, FFmpegError } from 'node-av';
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Create and allocate frame
const frame = new Frame();
frame.alloc();

// Configure video frame
frame.format = AV_PIX_FMT_YUV420P;
frame.width = 1920;
frame.height = 1080;
const ret = frame.allocBuffer();
FFmpegError.throwIfError(ret, 'allocBuffer');

// Receive decoded frame
const ret2 = await codecContext.receiveFrame(frame);
if (ret2 >= 0) {
  console.log(`Frame PTS: ${frame.pts}`);
  console.log(`Frame type: ${frame.pictType}`);
  console.log(`Keyframe: ${frame.keyFrame}`);
}

// Cleanup
frame.unref();
```

## See

 - \[AVFrame\](https://ffmpeg.org/doxygen/trunk/structAVFrame.html)
 - [CodecContext](CodecContext.md) For encoding/decoding frames
 - [FilterContext](FilterContext.md) For filtering frames

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeFrame`\>

## Constructors

### Constructor

> **new Frame**(): `Frame`

Defined in: [src/lib/frame.ts:65](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L65)

#### Returns

`Frame`

## Accessors

### bestEffortTimestamp

#### Get Signature

> **get** **bestEffortTimestamp**(): `bigint`

Defined in: [src/lib/frame.ts:161](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L161)

Best effort timestamp.

Frame timestamp estimated using various heuristics.
In time base units.

Direct mapping to AVFrame->best_effort_timestamp.

##### Returns

`bigint`

#### Set Signature

> **set** **bestEffortTimestamp**(`value`): `void`

Defined in: [src/lib/frame.ts:165](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L165)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### channelLayout

#### Get Signature

> **get** **channelLayout**(): [`ChannelLayout`](../interfaces/ChannelLayout.md)

Defined in: [src/lib/frame.ts:253](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L253)

Audio channel layout.

Describes the channel configuration.

Direct mapping to AVFrame->ch_layout.

##### Returns

[`ChannelLayout`](../interfaces/ChannelLayout.md)

#### Set Signature

> **set** **channelLayout**(`value`): `void`

Defined in: [src/lib/frame.ts:257](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L257)

##### Parameters

###### value

[`ChannelLayout`](../interfaces/ChannelLayout.md)

##### Returns

`void`

***

### channels

#### Get Signature

> **get** **channels**(): `number`

Defined in: [src/lib/frame.ts:266](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L266)

Number of audio channels.

Derived from channel layout.

##### Returns

`number`

***

### chromaLocation

#### Get Signature

> **get** **chromaLocation**(): `AVChromaLocation`

Defined in: [src/lib/frame.ts:348](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L348)

Chroma sample location.

Position of chroma samples.

Direct mapping to AVFrame->chroma_location.

##### Returns

`AVChromaLocation`

#### Set Signature

> **set** **chromaLocation**(`value`): `void`

Defined in: [src/lib/frame.ts:352](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L352)

##### Parameters

###### value

`AVChromaLocation`

##### Returns

`void`

***

### colorPrimaries

#### Get Signature

> **get** **colorPrimaries**(): `AVColorPrimaries`

Defined in: [src/lib/frame.ts:303](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L303)

Color primaries.

Chromaticity coordinates of the source primaries.

Direct mapping to AVFrame->color_primaries.

##### Returns

`AVColorPrimaries`

#### Set Signature

> **set** **colorPrimaries**(`value`): `void`

Defined in: [src/lib/frame.ts:307](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L307)

##### Parameters

###### value

`AVColorPrimaries`

##### Returns

`void`

***

### colorRange

#### Get Signature

> **get** **colorRange**(): `AVColorRange`

Defined in: [src/lib/frame.ts:288](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L288)

Color range.

MPEG (limited) or JPEG (full) range.

Direct mapping to AVFrame->color_range.

##### Returns

`AVColorRange`

#### Set Signature

> **set** **colorRange**(`value`): `void`

Defined in: [src/lib/frame.ts:292](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L292)

##### Parameters

###### value

`AVColorRange`

##### Returns

`void`

***

### colorSpace

#### Get Signature

> **get** **colorSpace**(): `AVColorSpace`

Defined in: [src/lib/frame.ts:333](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L333)

YUV color space.

Color space type for YUV content.

Direct mapping to AVFrame->colorspace.

##### Returns

`AVColorSpace`

#### Set Signature

> **set** **colorSpace**(`value`): `void`

Defined in: [src/lib/frame.ts:337](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L337)

##### Parameters

###### value

`AVColorSpace`

##### Returns

`void`

***

### colorTrc

#### Get Signature

> **get** **colorTrc**(): `AVColorTransferCharacteristic`

Defined in: [src/lib/frame.ts:318](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L318)

Color transfer characteristic.

Transfer function (gamma).

Direct mapping to AVFrame->color_trc.

##### Returns

`AVColorTransferCharacteristic`

#### Set Signature

> **set** **colorTrc**(`value`): `void`

Defined in: [src/lib/frame.ts:322](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L322)

##### Parameters

###### value

`AVColorTransferCharacteristic`

##### Returns

`void`

***

### data

#### Get Signature

> **get** **data**(): `null` \| `Buffer`\<`ArrayBufferLike`\>[]

Defined in: [src/lib/frame.ts:364](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L364)

Raw frame data planes.

Array of buffers containing the frame data.
One buffer per plane (e.g., Y, U, V for YUV420P).

Direct mapping to AVFrame->data.

##### Returns

`null` \| `Buffer`\<`ArrayBufferLike`\>[]

***

### extendedData

#### Get Signature

> **get** **extendedData**(): `null` \| `Buffer`\<`ArrayBufferLike`\>[]

Defined in: [src/lib/frame.ts:376](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L376)

Extended data planes.

For audio with >8 channels or planar audio.
Points to data planes beyond the first 8.

Direct mapping to AVFrame->extended_data.

##### Returns

`null` \| `Buffer`\<`ArrayBufferLike`\>[]

***

### format

#### Get Signature

> **get** **format**(): `AVPixelFormat` \| `AVSampleFormat`

Defined in: [src/lib/frame.ts:74](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L74)

Pixel format for video frames or sample format for audio.

Direct mapping to AVFrame->format.

##### Returns

`AVPixelFormat` \| `AVSampleFormat`

#### Set Signature

> **set** **format**(`value`): `void`

Defined in: [src/lib/frame.ts:78](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L78)

##### Parameters

###### value

`AVPixelFormat` | `AVSampleFormat`

##### Returns

`void`

***

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: [src/lib/frame.ts:100](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L100)

Height of video frame in pixels.

Direct mapping to AVFrame->height.

##### Returns

`number`

#### Set Signature

> **set** **height**(`value`): `void`

Defined in: [src/lib/frame.ts:104](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L104)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### hwFramesCtx

#### Get Signature

> **get** **hwFramesCtx**(): `null` \| [`HardwareFramesContext`](HardwareFramesContext.md)

Defined in: [src/lib/frame.ts:397](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L397)

Hardware frames context.

Reference to hardware frames context for GPU frames.
Null for software frames.

Direct mapping to AVFrame->hw_frames_ctx.

##### Returns

`null` \| [`HardwareFramesContext`](HardwareFramesContext.md)

#### Set Signature

> **set** **hwFramesCtx**(`value`): `void`

Defined in: [src/lib/frame.ts:416](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L416)

##### Parameters

###### value

`null` | [`HardwareFramesContext`](HardwareFramesContext.md)

##### Returns

`void`

***

### isWritable

#### Get Signature

> **get** **isWritable**(): `boolean`

Defined in: [src/lib/frame.ts:385](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L385)

Check if frame data is writable.

True if the frame data can be modified.

##### Returns

`boolean`

***

### keyFrame

#### Get Signature

> **get** **keyFrame**(): `number`

Defined in: [src/lib/frame.ts:192](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L192)

Whether this frame is a keyframe.

1 if keyframe, 0 otherwise.

Direct mapping to AVFrame->key_frame.

##### Returns

`number`

#### Set Signature

> **set** **keyFrame**(`value`): `void`

Defined in: [src/lib/frame.ts:196](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L196)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### linesize

#### Get Signature

> **get** **linesize**(): `number`[]

Defined in: [src/lib/frame.ts:277](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L277)

Line sizes for each plane.

Number of bytes per line for each data plane.

Direct mapping to AVFrame->linesize.

##### Returns

`number`[]

***

### nbSamples

#### Get Signature

> **get** **nbSamples**(): `number`

Defined in: [src/lib/frame.ts:113](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L113)

Number of audio samples per channel.

Direct mapping to AVFrame->nb_samples.

##### Returns

`number`

#### Set Signature

> **set** **nbSamples**(`value`): `void`

Defined in: [src/lib/frame.ts:117](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L117)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### pictType

#### Get Signature

> **get** **pictType**(): `AVPictureType`

Defined in: [src/lib/frame.ts:207](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L207)

Picture type of the frame.

Type of frame (I, P, B, etc.).

Direct mapping to AVFrame->pict_type.

##### Returns

`AVPictureType`

#### Set Signature

> **set** **pictType**(`value`): `void`

Defined in: [src/lib/frame.ts:211](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L211)

##### Parameters

###### value

`AVPictureType`

##### Returns

`void`

***

### pktDts

#### Get Signature

> **get** **pktDts**(): `bigint`

Defined in: [src/lib/frame.ts:145](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L145)

DTS from the packet that produced this frame.

Copy of packet DTS for reference.
In time base units. AV_NOPTS_VALUE if unknown.

Direct mapping to AVFrame->pkt_dts.

##### Returns

`bigint`

#### Set Signature

> **set** **pktDts**(`value`): `void`

Defined in: [src/lib/frame.ts:149](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L149)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### pts

#### Get Signature

> **get** **pts**(): `bigint`

Defined in: [src/lib/frame.ts:129](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L129)

Presentation timestamp.

Time when the frame should be presented.
In time base units. AV_NOPTS_VALUE if unknown.

Direct mapping to AVFrame->pts.

##### Returns

`bigint`

#### Set Signature

> **set** **pts**(`value`): `void`

Defined in: [src/lib/frame.ts:133](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L133)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### sampleAspectRatio

#### Get Signature

> **get** **sampleAspectRatio**(): [`Rational`](Rational.md)

Defined in: [src/lib/frame.ts:222](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L222)

Sample aspect ratio.

Pixel width/height ratio. 0/1 if unknown.

Direct mapping to AVFrame->sample_aspect_ratio.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **sampleAspectRatio**(`value`): `void`

Defined in: [src/lib/frame.ts:227](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L227)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### sampleRate

#### Get Signature

> **get** **sampleRate**(): `number`

Defined in: [src/lib/frame.ts:238](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L238)

Audio sample rate.

Number of samples per second.

Direct mapping to AVFrame->sample_rate.

##### Returns

`number`

#### Set Signature

> **set** **sampleRate**(`value`): `void`

Defined in: [src/lib/frame.ts:242](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L242)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### timeBase

#### Get Signature

> **get** **timeBase**(): [`Rational`](Rational.md)

Defined in: [src/lib/frame.ts:176](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L176)

Time base for timestamps.

Defines the unit of the timestamps (seconds per tick).

Direct mapping to AVFrame->time_base.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **timeBase**(`value`): `void`

Defined in: [src/lib/frame.ts:181](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L181)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: [src/lib/frame.ts:87](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L87)

Width of video frame in pixels.

Direct mapping to AVFrame->width.

##### Returns

`number`

#### Set Signature

> **set** **width**(`value`): `void`

Defined in: [src/lib/frame.ts:91](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L91)

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/frame.ts:902](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L902)

Dispose of the frame.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using frame = new Frame();
  frame.alloc();
  // Use frame...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(): `void`

Defined in: [src/lib/frame.ts:442](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L442)

Allocate a new frame.

Allocates the frame structure. Must be called before using the frame
unless it was created by another function (e.g., clone()).

Direct mapping to av_frame_alloc().

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
const frame = new Frame();
frame.alloc();
// Frame structure is now ready
```

#### See

 - [allocBuffer](#allocbuffer) To allocate data buffers
 - [free](#free) To deallocate the frame

***

### allocBuffer()

> **allocBuffer**(): `number`

Defined in: [src/lib/frame.ts:604](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L604)

Allocate data buffers for the frame.

Allocates buffers based on frame format and dimensions.
Frame parameters must be set before calling.

Direct mapping to av_frame_get_buffer().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid frame parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

frame.format = AV_PIX_FMT_YUV420P;
frame.width = 1920;
frame.height = 1080;
const ret = frame.allocBuffer();
FFmpegError.throwIfError(ret, 'allocBuffer');
```

#### See

[getBuffer](#getbuffer) To get required size

***

### clone()

> **clone**(): `null` \| `Frame`

Defined in: [src/lib/frame.ts:539](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L539)

Clone the frame.

Creates an independent copy of the frame with its own data buffers.
The new frame has the same content but can be modified independently.

Direct mapping to av_frame_clone().

#### Returns

`null` \| `Frame`

New frame instance, or null on allocation failure

#### Example

```typescript
const copy = frame.clone();
if (copy) {
  // Modify copy without affecting original
  copy.pts = frame.pts + 1000n;
}
```

#### See

 - [ref](#ref) To create reference instead of copy
 - [copy](#copy) To copy into existing frame

***

### copy()

> **copy**(`src`): `number`

Defined in: [src/lib/frame.ts:690](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L690)

Copy frame data and properties.

Copies both data and metadata from source frame.
Destination must have allocated buffers of correct size.

Direct mapping to av_frame_copy().

#### Parameters

##### src

`Frame`

Source frame to copy from

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Incompatible frames

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Allocate destination with same format
dstFrame.format = srcFrame.format;
dstFrame.width = srcFrame.width;
dstFrame.height = srcFrame.height;
dstFrame.allocBuffer();

const ret = dstFrame.copy(srcFrame);
FFmpegError.throwIfError(ret, 'copy');
```

#### See

 - [copyProps](#copyprops) To copy only properties
 - [clone](#clone) To create new frame with copy

***

### copyProps()

> **copyProps**(`src`): `number`

Defined in: [src/lib/frame.ts:657](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L657)

Copy frame properties without copying data.

Copies metadata, timestamps, format info, etc. but not the actual data.
Useful for preparing output frames with same properties.

Direct mapping to av_frame_copy_props().

#### Parameters

##### src

`Frame`

Source frame to copy properties from

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = dstFrame.copyProps(srcFrame);
FFmpegError.throwIfError(ret, 'copyProps');
// dstFrame now has same properties as srcFrame
```

#### See

[copy](#copy) To copy both properties and data

***

### free()

> **free**(): `void`

Defined in: [src/lib/frame.ts:461](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L461)

Free the frame.

Deallocates the frame and its data. The frame becomes invalid after this.

Direct mapping to av_frame_free().

#### Returns

`void`

#### Example

```typescript
frame.free();
// Frame is now invalid
```

#### See

[unref](#unref) To only free data, keeping structure

***

### fromBuffer()

> **fromBuffer**(`buffer`): `number`

Defined in: [src/lib/frame.ts:713](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L713)

Fill frame data from buffer.

Copies data from buffer into frame data planes.
Frame must have allocated buffers.

#### Parameters

##### buffer

`Buffer`

Source buffer with frame data

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

const buffer = Buffer.from(rawVideoData);
const ret = frame.fromBuffer(buffer);
FFmpegError.throwIfError(ret, 'fromBuffer');
```

***

### getBuffer()

> **getBuffer**(`align`): `number`

Defined in: [src/lib/frame.ts:574](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L574)

Get required buffer size for the frame.

Calculates the required buffer size based on frame parameters.
Must set format, width/height (video) or format, nb_samples, channel_layout (audio) first.

Direct mapping to av_frame_get_buffer().

#### Parameters

##### align

`number` = `0`

Buffer size alignment (0 for default)

#### Returns

`number`

Required buffer size in bytes, or negative AVERROR:
  - AVERROR_EINVAL: Invalid frame parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

const size = frame.getBuffer();
FFmpegError.throwIfError(size, 'getBuffer');
console.log(`Buffer size: ${size} bytes`);
```

#### See

[allocBuffer](#allocbuffer) To allocate the buffer

***

### getNative()

> **getNative**(): `NativeFrame`

Defined in: [src/lib/frame.ts:883](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L883)

**`Internal`**

Get the underlying native Frame object.

#### Returns

`NativeFrame`

The native Frame binding object

#### Implementation of

`NativeWrapper.getNative`

***

### getSideData()

> **getSideData**(`type`): `null` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [src/lib/frame.ts:815](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L815)

Get frame side data.

Retrieves additional data associated with the frame
(e.g., motion vectors, film grain, HDR metadata).

Direct mapping to av_frame_get_side_data().

#### Parameters

##### type

`AVFrameSideDataType`

Type of side data to retrieve

#### Returns

`null` \| `Buffer`\<`ArrayBufferLike`\>

Side data buffer, or null if not present

#### Example

```typescript
import { AV_FRAME_DATA_MOTION_VECTORS } from 'node-av/constants';

const motionVectors = frame.getSideData(AV_FRAME_DATA_MOTION_VECTORS);
if (motionVectors) {
  console.log(`Motion data size: ${motionVectors.length} bytes`);
}
```

#### See

 - [newSideData](#newsidedata) To add side data
 - [removeSideData](#removesidedata) To remove side data

***

### hwframeTransferData()

> **hwframeTransferData**(`dst`, `flags?`): `Promise`\<`number`\>

Defined in: [src/lib/frame.ts:745](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L745)

Transfer data between hardware and software frames.

Copies frame data between GPU and system memory.
Direction depends on source and destination frame types.

Direct mapping to av_hwframe_transfer_data().

#### Parameters

##### dst

`Frame`

Destination frame (software or hardware)

##### flags?

`number`

Transfer flags (0 for default)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Download from GPU to CPU
const swFrame = new Frame();
swFrame.alloc();
const ret = await hwFrame.hwframeTransferData(swFrame);
FFmpegError.throwIfError(ret, 'hwframeTransferData');
```

#### See

 - [isHwFrame](#ishwframe) To check if frame is hardware
 - [isSwFrame](#isswframe) To check if frame is software

***

### isHwFrame()

> **isHwFrame**(): `boolean`

Defined in: [src/lib/frame.ts:766](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L766)

Check if this is a hardware frame.

Returns true if frame data is in GPU memory.

#### Returns

`boolean`

True if hardware frame, false otherwise

#### Example

```typescript
if (frame.isHwFrame()) {
  console.log('Frame is in GPU memory');
}
```

#### See

 - [isSwFrame](#isswframe) To check for software frame
 - [hwframeTransferData](#hwframetransferdata) To transfer between GPU/CPU

***

### isSwFrame()

> **isSwFrame**(): `boolean`

Defined in: [src/lib/frame.ts:787](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L787)

Check if this is a software frame.

Returns true if frame data is in system memory.

#### Returns

`boolean`

True if software frame, false otherwise

#### Example

```typescript
if (frame.isSwFrame()) {
  console.log('Frame is in system memory');
}
```

#### See

 - [isHwFrame](#ishwframe) To check for hardware frame
 - [hwframeTransferData](#hwframetransferdata) To transfer between GPU/CPU

***

### makeWritable()

> **makeWritable**(): `number`

Defined in: [src/lib/frame.ts:630](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L630)

Ensure frame data is writable.

Creates a private copy of the data if it's shared with other frames.
Call before modifying frame data to avoid affecting other references.

Direct mapping to av_frame_make_writable().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid frame

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Ensure we can safely modify data
const ret = frame.makeWritable();
FFmpegError.throwIfError(ret, 'makeWritable');
// Now safe to modify frame.data
```

***

### newSideData()

> **newSideData**(`type`, `size`): `Buffer`

Defined in: [src/lib/frame.ts:848](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L848)

Allocate new side data.

Allocates side data buffer attached to the frame.
Returns buffer that can be written to directly.

Direct mapping to av_frame_new_side_data().

#### Parameters

##### type

`AVFrameSideDataType`

Type of side data

##### size

`number`

Size in bytes to allocate

#### Returns

`Buffer`

Allocated buffer for writing

#### Throws

If allocation fails

#### Example

```typescript
import { AV_FRAME_DATA_MASTERING_DISPLAY_METADATA } from 'node-av/constants';

// Allocate and write HDR metadata
const hdrData = frame.newSideData(
  AV_FRAME_DATA_MASTERING_DISPLAY_METADATA,
  40
);
// Write metadata to buffer...
```

#### See

 - [getSideData](#getsidedata) To retrieve side data
 - [removeSideData](#removesidedata) To remove side data

***

### ref()

> **ref**(`src`): `number`

Defined in: [src/lib/frame.ts:492](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L492)

Create a reference to another frame.

Sets up this frame as a reference to the source frame's data.
Both frames will share the same data buffers.

Direct mapping to av_frame_ref().

#### Parameters

##### src

`Frame`

Source frame to reference

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

const frame2 = new Frame();
frame2.alloc();
const ret = frame2.ref(frame1);
FFmpegError.throwIfError(ret, 'ref');
// frame2 now references frame1's data
```

#### See

 - [unref](#unref) To remove reference
 - [clone](#clone) To create independent copy

***

### removeSideData()

> **removeSideData**(`type`): `void`

Defined in: [src/lib/frame.ts:872](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L872)

Remove side data from frame.

Removes specific type of side data.

Direct mapping to av_frame_remove_side_data().

#### Parameters

##### type

`AVFrameSideDataType`

Type of side data to remove

#### Returns

`void`

#### Example

```typescript
import { AV_FRAME_DATA_MOTION_VECTORS } from 'node-av/constants';

frame.removeSideData(AV_FRAME_DATA_MOTION_VECTORS);
// Motion vectors removed
```

#### See

 - [getSideData](#getsidedata) To retrieve side data
 - [newSideData](#newsidedata) To add side data

***

### unref()

> **unref**(): `void`

Defined in: [src/lib/frame.ts:513](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/frame.ts#L513)

Unreference the frame.

Frees the frame data if this was the last reference.
The frame structure remains allocated and can be reused.

Direct mapping to av_frame_unref().

#### Returns

`void`

#### Example

```typescript
frame.unref();
// Frame data is freed, structure can be reused
```

#### See

 - [ref](#ref) To create reference
 - [free](#free) To free everything
