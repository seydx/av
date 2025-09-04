[node-av](../globals.md) / CodecContext

# Class: CodecContext

Defined in: [src/lib/codec-context.ts:73](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L73)

Codec context for encoding and decoding.

Main structure for codec operations, containing all codec parameters and state.
Handles encoding raw frames to packets and decoding packets to frames.
Supports both software and hardware-accelerated codecs.
Must be configured and opened before use.

Direct mapping to FFmpeg's AVCodecContext.

## Example

```typescript
import { CodecContext, Codec, FFmpegError } from 'node-av';
import { AV_CODEC_ID_H264, AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Create decoder
const decoder = new CodecContext();
const codec = Codec.findDecoder(AV_CODEC_ID_H264);
decoder.allocContext3(codec);

// Configure from stream parameters
decoder.parametersToContext(stream.codecpar);

// Open decoder
let ret = await decoder.open2(codec);
FFmpegError.throwIfError(ret, 'open2');

// Decode packets
ret = await decoder.sendPacket(packet);
if (ret >= 0) {
  ret = await decoder.receiveFrame(frame);
  if (ret >= 0) {
    // Process decoded frame
  }
}

// Cleanup
decoder.freeContext();
```

## See

 - \[AVCodecContext\](https://ffmpeg.org/doxygen/trunk/structAVCodecContext.html)
 - [Codec](Codec.md) For finding codecs
 - [CodecParameters](CodecParameters.md) For stream parameters

## Extends

- `OptionMember`\<`NativeCodecContext`\>

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeCodecContext`\>

## Constructors

### Constructor

> **new CodecContext**(): `CodecContext`

Defined in: [src/lib/codec-context.ts:77](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L77)

#### Returns

`CodecContext`

#### Overrides

`OptionMember<NativeCodecContext>.constructor`

## Properties

### native

> `protected` **native**: `NativeCodecContext`

Defined in: [src/lib/option.ts:733](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L733)

#### Inherited from

`OptionMember.native`

## Accessors

### bitRate

#### Get Signature

> **get** **bitRate**(): `bigint`

Defined in: [src/lib/codec-context.ts:115](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L115)

Average bitrate.

Target bitrate for encoding, detected bitrate for decoding.
In bits per second.

Direct mapping to AVCodecContext->bit_rate.

##### Returns

`bigint`

#### Set Signature

> **set** **bitRate**(`value`): `void`

Defined in: [src/lib/codec-context.ts:119](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L119)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### channelLayout

#### Get Signature

> **get** **channelLayout**(): [`ChannelLayout`](../interfaces/ChannelLayout.md)

Defined in: [src/lib/codec-context.ts:535](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L535)

Audio channel layout.

Describes channel configuration.

Direct mapping to AVCodecContext->ch_layout.

##### Returns

[`ChannelLayout`](../interfaces/ChannelLayout.md)

#### Set Signature

> **set** **channelLayout**(`value`): `void`

Defined in: [src/lib/codec-context.ts:539](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L539)

##### Parameters

###### value

[`ChannelLayout`](../interfaces/ChannelLayout.md)

##### Returns

`void`

***

### channels

#### Get Signature

> **get** **channels**(): `number`

Defined in: [src/lib/codec-context.ts:481](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L481)

Number of audio channels.

Direct mapping to AVCodecContext->channels.

##### Returns

`number`

#### Set Signature

> **set** **channels**(`value`): `void`

Defined in: [src/lib/codec-context.ts:485](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L485)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### chromaLocation

#### Get Signature

> **get** **chromaLocation**(): `AVChromaLocation`

Defined in: [src/lib/codec-context.ts:453](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L453)

Chroma sample location.

Position of chroma samples.

Direct mapping to AVCodecContext->chroma_sample_location.

##### Returns

`AVChromaLocation`

#### Set Signature

> **set** **chromaLocation**(`value`): `void`

Defined in: [src/lib/codec-context.ts:457](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L457)

##### Parameters

###### value

`AVChromaLocation`

##### Returns

`void`

***

### codecId

#### Get Signature

> **get** **codecId**(): `AVCodecID`

Defined in: [src/lib/codec-context.ts:99](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L99)

Codec identifier.

Direct mapping to AVCodecContext->codec_id.

##### Returns

`AVCodecID`

#### Set Signature

> **set** **codecId**(`value`): `void`

Defined in: [src/lib/codec-context.ts:103](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L103)

##### Parameters

###### value

`AVCodecID`

##### Returns

`void`

***

### codecType

#### Get Signature

> **get** **codecType**(): `AVMediaType`

Defined in: [src/lib/codec-context.ts:86](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L86)

Type of codec (video/audio/subtitle).

Direct mapping to AVCodecContext->codec_type.

##### Returns

`AVMediaType`

#### Set Signature

> **set** **codecType**(`value`): `void`

Defined in: [src/lib/codec-context.ts:90](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L90)

##### Parameters

###### value

`AVMediaType`

##### Returns

`void`

***

### colorPrimaries

#### Get Signature

> **get** **colorPrimaries**(): `AVColorPrimaries`

Defined in: [src/lib/codec-context.ts:408](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L408)

Color primaries.

Chromaticity coordinates of source primaries.

Direct mapping to AVCodecContext->color_primaries.

##### Returns

`AVColorPrimaries`

#### Set Signature

> **set** **colorPrimaries**(`value`): `void`

Defined in: [src/lib/codec-context.ts:412](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L412)

##### Parameters

###### value

`AVColorPrimaries`

##### Returns

`void`

***

### colorRange

#### Get Signature

> **get** **colorRange**(): `AVColorRange`

Defined in: [src/lib/codec-context.ts:393](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L393)

Color range.

MPEG (limited) or JPEG (full) range.

Direct mapping to AVCodecContext->color_range.

##### Returns

`AVColorRange`

#### Set Signature

> **set** **colorRange**(`value`): `void`

Defined in: [src/lib/codec-context.ts:397](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L397)

##### Parameters

###### value

`AVColorRange`

##### Returns

`void`

***

### colorSpace

#### Get Signature

> **get** **colorSpace**(): `AVColorSpace`

Defined in: [src/lib/codec-context.ts:438](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L438)

YUV color space.

Color space for YUV content.

Direct mapping to AVCodecContext->colorspace.

##### Returns

`AVColorSpace`

#### Set Signature

> **set** **colorSpace**(`value`): `void`

Defined in: [src/lib/codec-context.ts:442](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L442)

##### Parameters

###### value

`AVColorSpace`

##### Returns

`void`

***

### colorTrc

#### Get Signature

> **get** **colorTrc**(): `AVColorTransferCharacteristic`

Defined in: [src/lib/codec-context.ts:423](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L423)

Color transfer characteristic.

Transfer function (gamma).

Direct mapping to AVCodecContext->color_trc.

##### Returns

`AVColorTransferCharacteristic`

#### Set Signature

> **set** **colorTrc**(`value`): `void`

Defined in: [src/lib/codec-context.ts:427](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L427)

##### Parameters

###### value

`AVColorTransferCharacteristic`

##### Returns

`void`

***

### delay

#### Get Signature

> **get** **delay**(): `number`

Defined in: [src/lib/codec-context.ts:162](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L162)

Codec delay.

Number of frames the decoder needs to output before first frame.

Direct mapping to AVCodecContext->delay.

##### Returns

`number`

***

### extraData

#### Get Signature

> **get** **extraData**(): `null` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [src/lib/codec-context.ts:203](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L203)

Extra binary data for codec.

Contains codec-specific initialization data.

Direct mapping to AVCodecContext->extradata.

##### Returns

`null` \| `Buffer`\<`ArrayBufferLike`\>

#### Set Signature

> **set** **extraData**(`value`): `void`

Defined in: [src/lib/codec-context.ts:207](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L207)

##### Parameters

###### value

`null` | `Buffer`\<`ArrayBufferLike`\>

##### Returns

`void`

***

### flags

#### Get Signature

> **get** **flags**(): `AVCodecFlag`

Defined in: [src/lib/codec-context.ts:173](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L173)

Codec flags.

Combination of AV_CODEC_FLAG_* values.

Direct mapping to AVCodecContext->flags.

##### Returns

`AVCodecFlag`

#### Set Signature

> **set** **flags**(`value`): `void`

Defined in: [src/lib/codec-context.ts:177](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L177)

##### Parameters

###### value

`AVCodecFlag`

##### Returns

`void`

***

### flags2

#### Get Signature

> **get** **flags2**(): `AVCodecFlag2`

Defined in: [src/lib/codec-context.ts:188](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L188)

Additional codec flags.

Combination of AV_CODEC_FLAG2_* values.

Direct mapping to AVCodecContext->flags2.

##### Returns

`AVCodecFlag2`

#### Set Signature

> **set** **flags2**(`value`): `void`

Defined in: [src/lib/codec-context.ts:192](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L192)

##### Parameters

###### value

`AVCodecFlag2`

##### Returns

`void`

***

### frameNumber

#### Get Signature

> **get** **frameNumber**(): `number`

Defined in: [src/lib/codec-context.ts:524](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L524)

Current frame number.

Frame counter for debugging.

Direct mapping to AVCodecContext->frame_number.

##### Returns

`number`

***

### framerate

#### Get Signature

> **get** **framerate**(): [`Rational`](Rational.md)

Defined in: [src/lib/codec-context.ts:377](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L377)

Frame rate.

Frames per second for encoding.

Direct mapping to AVCodecContext->framerate.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **framerate**(`value`): `void`

Defined in: [src/lib/codec-context.ts:382](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L382)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### frameSize

#### Get Signature

> **get** **frameSize**(): `number`

Defined in: [src/lib/codec-context.ts:509](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L509)

Number of samples per audio frame.

Direct mapping to AVCodecContext->frame_size.

##### Returns

`number`

#### Set Signature

> **set** **frameSize**(`value`): `void`

Defined in: [src/lib/codec-context.ts:513](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L513)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### gopSize

#### Get Signature

> **get** **gopSize**(): `number`

Defined in: [src/lib/codec-context.ts:290](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L290)

Group of pictures size.

Maximum number of frames between keyframes.

Direct mapping to AVCodecContext->gop_size.

##### Returns

`number`

#### Set Signature

> **set** **gopSize**(`value`): `void`

Defined in: [src/lib/codec-context.ts:294](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L294)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### hasBFrames

#### Get Signature

> **get** **hasBFrames**(): `number`

Defined in: [src/lib/codec-context.ts:350](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L350)

Number of frames delay in decoder.

For codecs with B-frames.

Direct mapping to AVCodecContext->has_b_frames.

##### Returns

`number`

***

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: [src/lib/codec-context.ts:275](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L275)

Picture height in pixels.

Direct mapping to AVCodecContext->height.

##### Returns

`number`

#### Set Signature

> **set** **height**(`value`): `void`

Defined in: [src/lib/codec-context.ts:279](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L279)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### hwDeviceCtx

#### Get Signature

> **get** **hwDeviceCtx**(): `null` \| [`HardwareDeviceContext`](HardwareDeviceContext.md)

Defined in: [src/lib/codec-context.ts:625](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L625)

Hardware device context.

Reference to hardware device for acceleration.

Direct mapping to AVCodecContext->hw_device_ctx.

##### Returns

`null` \| [`HardwareDeviceContext`](HardwareDeviceContext.md)

#### Set Signature

> **set** **hwDeviceCtx**(`value`): `void`

Defined in: [src/lib/codec-context.ts:645](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L645)

##### Parameters

###### value

`null` | [`HardwareDeviceContext`](HardwareDeviceContext.md)

##### Returns

`void`

***

### hwFramesCtx

#### Get Signature

> **get** **hwFramesCtx**(): `null` \| [`HardwareFramesContext`](HardwareFramesContext.md)

Defined in: [src/lib/codec-context.ts:658](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L658)

Hardware frames context.

Reference to hardware frames for GPU memory.

Direct mapping to AVCodecContext->hw_frames_ctx.

##### Returns

`null` \| [`HardwareFramesContext`](HardwareFramesContext.md)

#### Set Signature

> **set** **hwFramesCtx**(`value`): `void`

Defined in: [src/lib/codec-context.ts:678](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L678)

##### Parameters

###### value

`null` | [`HardwareFramesContext`](HardwareFramesContext.md)

##### Returns

`void`

***

### isOpen

#### Get Signature

> **get** **isOpen**(): `boolean`

Defined in: [src/lib/codec-context.ts:689](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L689)

Check if codec is open.

True if the codec has been opened.

##### Returns

`boolean`

***

### level

#### Get Signature

> **get** **level**(): `number`

Defined in: [src/lib/codec-context.ts:233](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L233)

Codec level.

Level within the specified profile.

Direct mapping to AVCodecContext->level.

##### Returns

`number`

#### Set Signature

> **set** **level**(`value`): `void`

Defined in: [src/lib/codec-context.ts:237](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L237)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### maxBFrames

#### Get Signature

> **get** **maxBFrames**(): `number`

Defined in: [src/lib/codec-context.ts:320](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L320)

Maximum number of B-frames.

B-frames between non-B-frames.

Direct mapping to AVCodecContext->max_b_frames.

##### Returns

`number`

#### Set Signature

> **set** **maxBFrames**(`value`): `void`

Defined in: [src/lib/codec-context.ts:324](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L324)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### mbDecision

#### Get Signature

> **get** **mbDecision**(): `number`

Defined in: [src/lib/codec-context.ts:335](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L335)

Macroblock decision mode.

Algorithm for macroblock decision.

Direct mapping to AVCodecContext->mb_decision.

##### Returns

`number`

#### Set Signature

> **set** **mbDecision**(`value`): `void`

Defined in: [src/lib/codec-context.ts:339](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L339)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### pixelFormat

#### Get Signature

> **get** **pixelFormat**(): `AVPixelFormat`

Defined in: [src/lib/codec-context.ts:305](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L305)

Pixel format.

Format of the video frames.

Direct mapping to AVCodecContext->pix_fmt.

##### Returns

`AVPixelFormat`

#### Set Signature

> **set** **pixelFormat**(`value`): `void`

Defined in: [src/lib/codec-context.ts:309](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L309)

##### Parameters

###### value

`AVPixelFormat`

##### Returns

`void`

***

### pktTimebase

#### Get Signature

> **get** **pktTimebase**(): [`Rational`](Rational.md)

Defined in: [src/lib/codec-context.ts:146](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L146)

Packet time base.

Time base of the packets from/to the demuxer/muxer.

Direct mapping to AVCodecContext->pkt_timebase.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **pktTimebase**(`value`): `void`

Defined in: [src/lib/codec-context.ts:151](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L151)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### profile

#### Get Signature

> **get** **profile**(): `AVProfile`

Defined in: [src/lib/codec-context.ts:218](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L218)

Codec profile.

FF_PROFILE_* value indicating codec profile.

Direct mapping to AVCodecContext->profile.

##### Returns

`AVProfile`

#### Set Signature

> **set** **profile**(`value`): `void`

Defined in: [src/lib/codec-context.ts:222](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L222)

##### Parameters

###### value

`AVProfile`

##### Returns

`void`

***

### qMax

#### Get Signature

> **get** **qMax**(): `number`

Defined in: [src/lib/codec-context.ts:565](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L565)

Maximum quantizer.

Maximum quantization parameter.

Direct mapping to AVCodecContext->qmax.

##### Returns

`number`

#### Set Signature

> **set** **qMax**(`value`): `void`

Defined in: [src/lib/codec-context.ts:569](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L569)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### qMin

#### Get Signature

> **get** **qMin**(): `number`

Defined in: [src/lib/codec-context.ts:550](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L550)

Minimum quantizer.

Minimum quantization parameter.

Direct mapping to AVCodecContext->qmin.

##### Returns

`number`

#### Set Signature

> **set** **qMin**(`value`): `void`

Defined in: [src/lib/codec-context.ts:554](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L554)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### rcBufferSize

#### Get Signature

> **get** **rcBufferSize**(): `number`

Defined in: [src/lib/codec-context.ts:580](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L580)

Rate control buffer size.

Decoder bitstream buffer size.

Direct mapping to AVCodecContext->rc_buffer_size.

##### Returns

`number`

#### Set Signature

> **set** **rcBufferSize**(`value`): `void`

Defined in: [src/lib/codec-context.ts:584](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L584)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### rcMaxRate

#### Get Signature

> **get** **rcMaxRate**(): `bigint`

Defined in: [src/lib/codec-context.ts:595](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L595)

Maximum bitrate.

Maximum bitrate in bits per second.

Direct mapping to AVCodecContext->rc_max_rate.

##### Returns

`bigint`

#### Set Signature

> **set** **rcMaxRate**(`value`): `void`

Defined in: [src/lib/codec-context.ts:599](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L599)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### rcMinRate

#### Get Signature

> **get** **rcMinRate**(): `bigint`

Defined in: [src/lib/codec-context.ts:610](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L610)

Minimum bitrate.

Minimum bitrate in bits per second.

Direct mapping to AVCodecContext->rc_min_rate.

##### Returns

`bigint`

#### Set Signature

> **set** **rcMinRate**(`value`): `void`

Defined in: [src/lib/codec-context.ts:614](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L614)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### sampleAspectRatio

#### Get Signature

> **get** **sampleAspectRatio**(): [`Rational`](Rational.md)

Defined in: [src/lib/codec-context.ts:361](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L361)

Sample aspect ratio.

Pixel width/height ratio.

Direct mapping to AVCodecContext->sample_aspect_ratio.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **sampleAspectRatio**(`value`): `void`

Defined in: [src/lib/codec-context.ts:366](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L366)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### sampleFormat

#### Get Signature

> **get** **sampleFormat**(): `AVSampleFormat`

Defined in: [src/lib/codec-context.ts:496](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L496)

Audio sample format.

Format of audio samples.

Direct mapping to AVCodecContext->sample_fmt.

##### Returns

`AVSampleFormat`

#### Set Signature

> **set** **sampleFormat**(`value`): `void`

Defined in: [src/lib/codec-context.ts:500](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L500)

##### Parameters

###### value

`AVSampleFormat`

##### Returns

`void`

***

### sampleRate

#### Get Signature

> **get** **sampleRate**(): `number`

Defined in: [src/lib/codec-context.ts:468](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L468)

Audio sample rate.

Samples per second.

Direct mapping to AVCodecContext->sample_rate.

##### Returns

`number`

#### Set Signature

> **set** **sampleRate**(`value`): `void`

Defined in: [src/lib/codec-context.ts:472](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L472)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### threadCount

#### Get Signature

> **get** **threadCount**(): `number`

Defined in: [src/lib/codec-context.ts:249](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L249)

Thread count for codec.

Number of threads to use for decoding/encoding.
0 for automatic selection.

Direct mapping to AVCodecContext->thread_count.

##### Returns

`number`

#### Set Signature

> **set** **threadCount**(`value`): `void`

Defined in: [src/lib/codec-context.ts:253](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L253)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### timeBase

#### Get Signature

> **get** **timeBase**(): [`Rational`](Rational.md)

Defined in: [src/lib/codec-context.ts:130](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L130)

Time base for timestamps.

Fundamental unit of time in seconds for this context.

Direct mapping to AVCodecContext->time_base.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **timeBase**(`value`): `void`

Defined in: [src/lib/codec-context.ts:135](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L135)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: [src/lib/codec-context.ts:262](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L262)

Picture width in pixels.

Direct mapping to AVCodecContext->width.

##### Returns

`number`

#### Set Signature

> **set** **width**(`value`): `void`

Defined in: [src/lib/codec-context.ts:266](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L266)

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/codec-context.ts:1022](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L1022)

Dispose of the codec context.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling freeContext().

#### Returns

`void`

#### Example

```typescript
{
  using ctx = new CodecContext();
  ctx.allocContext3(codec);
  await ctx.open2();
  // Use context...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### allocContext3()

> **allocContext3**(`codec`): `void`

Defined in: [src/lib/codec-context.ts:714](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L714)

Allocate codec context.

Allocates and initializes the context for the given codec.

Direct mapping to avcodec_alloc_context3().

#### Parameters

##### codec

Codec to use (null for default)

`null` | [`Codec`](Codec.md)

#### Returns

`void`

#### Example

```typescript
import { Codec } from 'node-av';
import { AV_CODEC_ID_H264 } from 'node-av/constants';

const codec = Codec.findDecoder(AV_CODEC_ID_H264);
ctx.allocContext3(codec);
```

#### See

 - [open2](#open2) To open the codec
 - [freeContext](#freecontext) To free the context

***

### flushBuffers()

> **flushBuffers**(): `void`

Defined in: [src/lib/codec-context.ts:835](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L835)

Flush codec buffers.

Resets the internal codec state.
Used when seeking or switching streams.

Direct mapping to avcodec_flush_buffers().

#### Returns

`void`

#### Example

```typescript
// Flush when seeking
ctx.flushBuffers();
// Codec is now ready for new data
```

***

### freeContext()

> **freeContext**(): `void`

Defined in: [src/lib/codec-context.ts:734](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L734)

Free the codec context.

Releases all resources. The context becomes invalid.

Direct mapping to avcodec_free_context().

#### Returns

`void`

#### Example

```typescript
ctx.freeContext();
// Context is now invalid
```

#### See

 - Symbol.dispose For automatic cleanup
 - [allocContext3](#alloccontext3) To allocate a new context

***

### getNative()

> **getNative**(): `NativeCodecContext`

Defined in: [src/lib/codec-context.ts:1002](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L1002)

**`Internal`**

Get the underlying native CodecContext object.

#### Returns

`NativeCodecContext`

The native CodecContext binding object

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

### open2()

> **open2**(`codec`, `options`): `Promise`\<`number`\>

Defined in: [src/lib/codec-context.ts:764](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L764)

Open the codec.

Initializes the codec for encoding/decoding.
Must be called before processing frames/packets.

Direct mapping to avcodec_open2().

#### Parameters

##### codec

Codec to open with (null to use already set)

`null` | [`Codec`](Codec.md)

##### options

Codec-specific options

`null` | [`Dictionary`](Dictionary.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = await ctx.open2(codec);
FFmpegError.throwIfError(ret, 'open2');
// Codec is now open and ready
```

#### See

 - [allocContext3](#alloccontext3) Must be called first
 - [isOpen](#isopen) To check if open

***

### parametersFromContext()

> **parametersFromContext**(`params`): `number`

Defined in: [src/lib/codec-context.ts:816](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L816)

Fill parameters from codec context.

Copies codec parameters from context to stream.
Used when setting up encoders.

Direct mapping to avcodec_parameters_from_context().

#### Parameters

##### params

[`CodecParameters`](CodecParameters.md)

Destination codec parameters

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = ctx.parametersFromContext(stream.codecpar);
FFmpegError.throwIfError(ret, 'parametersFromContext');
```

#### See

[parametersToContext](#parameterstocontext) For the reverse

***

### parametersToContext()

> **parametersToContext**(`params`): `number`

Defined in: [src/lib/codec-context.ts:790](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L790)

Fill codec context from parameters.

Copies codec parameters from stream to context.
Used when setting up decoders.

Direct mapping to avcodec_parameters_to_context().

#### Parameters

##### params

[`CodecParameters`](CodecParameters.md)

Source codec parameters

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = ctx.parametersToContext(stream.codecpar);
FFmpegError.throwIfError(ret, 'parametersToContext');
```

#### See

[parametersFromContext](#parametersfromcontext) For the reverse

***

### receiveFrame()

> **receiveFrame**(`frame`): `Promise`\<`number`\>

Defined in: [src/lib/codec-context.ts:903](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L903)

Receive decoded frame.

Gets a decoded frame from the decoder.
Call after sendPacket().

Direct mapping to avcodec_receive_frame().

#### Parameters

##### frame

[`Frame`](Frame.md)

Frame to receive into

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: Need more input
  - AVERROR_EOF: All frames have been output
  - AVERROR_EINVAL: Invalid decoder state

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EAGAIN, AVERROR_EOF } from 'node-av';

const ret = await ctx.receiveFrame(frame);
if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
  // No frame available
} else {
  FFmpegError.throwIfError(ret, 'receiveFrame');
  // Process decoded frame
}
```

#### See

[sendPacket](#sendpacket) To send packets for decoding

***

### receivePacket()

> **receivePacket**(`packet`): `Promise`\<`number`\>

Defined in: [src/lib/codec-context.ts:971](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L971)

Receive encoded packet.

Gets an encoded packet from the encoder.
Call after sendFrame().

Direct mapping to avcodec_receive_packet().

#### Parameters

##### packet

[`Packet`](Packet.md)

Packet to receive into

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: Need more input
  - AVERROR_EOF: All packets have been output
  - AVERROR_EINVAL: Invalid encoder state

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EAGAIN, AVERROR_EOF } from 'node-av';

const ret = await ctx.receivePacket(packet);
if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
  // No packet available
} else {
  FFmpegError.throwIfError(ret, 'receivePacket');
  // Process encoded packet
}
```

#### See

[sendFrame](#sendframe) To send frames for encoding

***

### sendFrame()

> **sendFrame**(`frame`): `Promise`\<`number`\>

Defined in: [src/lib/codec-context.ts:937](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L937)

Send frame to encoder.

Submits raw frame for encoding.
Call receivePacket() to get encoded packets.

Direct mapping to avcodec_send_frame().

#### Parameters

##### frame

Frame to encode (null to flush)

`null` | [`Frame`](Frame.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: Must receive packets first
  - AVERROR_EOF: Encoder has been flushed
  - AVERROR_EINVAL: Invalid encoder state
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EAGAIN } from 'node-av';

const ret = await ctx.sendFrame(frame);
if (ret === AVERROR_EAGAIN) {
  // Need to receive packets first
} else {
  FFmpegError.throwIfError(ret, 'sendFrame');
}
```

#### See

[receivePacket](#receivepacket) To get encoded packets

***

### sendPacket()

> **sendPacket**(`packet`): `Promise`\<`number`\>

Defined in: [src/lib/codec-context.ts:869](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L869)

Send packet to decoder.

Submits encoded data for decoding.
Call receiveFrame() to get decoded frames.

Direct mapping to avcodec_send_packet().

#### Parameters

##### packet

Packet to decode (null to flush)

`null` | [`Packet`](Packet.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: Must receive frames first
  - AVERROR_EOF: Decoder has been flushed
  - AVERROR_EINVAL: Invalid decoder state
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EAGAIN } from 'node-av';

const ret = await ctx.sendPacket(packet);
if (ret === AVERROR_EAGAIN) {
  // Need to receive frames first
} else {
  FFmpegError.throwIfError(ret, 'sendPacket');
}
```

#### See

[receiveFrame](#receiveframe) To get decoded frames

***

### setHardwarePixelFormat()

> **setHardwarePixelFormat**(`hwFormat`, `swFormat?`): `void`

Defined in: [src/lib/codec-context.ts:991](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-context.ts#L991)

Set hardware pixel format.

Configures hardware acceleration pixel formats.
Used in get_format callback for hardware decoding.

#### Parameters

##### hwFormat

`AVPixelFormat`

Hardware pixel format

##### swFormat?

`AVPixelFormat`

Software pixel format (optional)

#### Returns

`void`

#### Example

```typescript
import { AV_PIX_FMT_CUDA, AV_PIX_FMT_NV12 } from 'node-av/constants';

ctx.setHardwarePixelFormat(AV_PIX_FMT_CUDA, AV_PIX_FMT_NV12);
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
