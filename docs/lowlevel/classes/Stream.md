[node-av](../globals.md) / Stream

# Class: Stream

Defined in: [src/lib/stream.ts:50](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L50)

Media stream within a format context.

Represents a single stream (video, audio, subtitle, etc.) within a media container.
Contains stream-specific information including codec parameters, timing information,
metadata, and disposition flags. Each stream in a file has a unique index and may
contain packets of compressed data.

Direct mapping to FFmpeg's AVStream.

## Example

```typescript
import { FormatContext, FFmpegError } from 'node-av';
import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';

// Access streams from format context
const formatContext = new FormatContext();
await formatContext.openInput('video.mp4');

// Iterate through streams
for (let i = 0; i < formatContext.nbStreams; i++) {
  const stream = formatContext.streams[i];
  const codecpar = stream.codecpar;

  if (codecpar.codecType === AVMEDIA_TYPE_VIDEO) {
    console.log(`Video stream ${stream.index}:`);
    console.log(`  Codec: ${codecpar.codecId}`);
    console.log(`  Resolution: ${codecpar.width}x${codecpar.height}`);
    console.log(`  Frame rate: ${stream.avgFrameRate.num}/${stream.avgFrameRate.den}`);
  } else if (codecpar.codecType === AVMEDIA_TYPE_AUDIO) {
    console.log(`Audio stream ${stream.index}:`);
    console.log(`  Sample rate: ${codecpar.sampleRate} Hz`);
    console.log(`  Channels: ${codecpar.channels}`);
  }
}
```

## See

 - \[AVStream\](https://ffmpeg.org/doxygen/trunk/structAVStream.html)
 - [FormatContext](FormatContext.md) For container operations
 - [CodecParameters](CodecParameters.md) For codec configuration

## Implements

- `NativeWrapper`\<`NativeStream`\>

## Constructors

### Constructor

> **new Stream**(`native`): `Stream`

Defined in: [src/lib/stream.ts:58](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L58)

**`Internal`**

#### Parameters

##### native

`NativeStream`

The native stream instance

#### Returns

`Stream`

## Accessors

### attachedPic

#### Get Signature

> **get** **attachedPic**(): `null` \| [`Packet`](Packet.md)

Defined in: [src/lib/stream.ts:303](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L303)

Attached picture.

For streams with AV_DISPOSITION_ATTACHED_PIC set,
contains the attached picture (e.g., album art).

Direct mapping to AVStream->attached_pic.

##### Returns

`null` \| [`Packet`](Packet.md)

***

### avgFrameRate

#### Get Signature

> **get** **avgFrameRate**(): [`Rational`](Rational.md)

Defined in: [src/lib/stream.ts:241](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L241)

Average frame rate.

Average framerate of the stream.
0/1 if unknown or variable frame rate.

Direct mapping to AVStream->avg_frame_rate.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **avgFrameRate**(`value`): `void`

Defined in: [src/lib/stream.ts:250](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L250)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### codecpar

#### Get Signature

> **get** **codecpar**(): [`CodecParameters`](CodecParameters.md)

Defined in: [src/lib/stream.ts:98](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L98)

Codec parameters.

Contains essential codec configuration for this stream.
Used to initialize decoders and describe stream properties.

Direct mapping to AVStream->codecpar.

##### Returns

[`CodecParameters`](CodecParameters.md)

#### Set Signature

> **set** **codecpar**(`value`): `void`

Defined in: [src/lib/stream.ts:111](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L111)

##### Parameters

###### value

[`CodecParameters`](CodecParameters.md)

##### Returns

`void`

***

### discard

#### Get Signature

> **get** **discard**(): `AVDiscard`

Defined in: [src/lib/stream.ts:208](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L208)

Discard setting.

Indicates which packets can be discarded during demuxing.
Used to skip non-essential packets for performance.

Direct mapping to AVStream->discard.

##### Returns

`AVDiscard`

#### Set Signature

> **set** **discard**(`value`): `void`

Defined in: [src/lib/stream.ts:212](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L212)

##### Parameters

###### value

`AVDiscard`

##### Returns

`void`

***

### disposition

#### Get Signature

> **get** **disposition**(): `AVDisposition`

Defined in: [src/lib/stream.ts:192](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L192)

Stream disposition flags.

Combination of AV_DISPOSITION_* flags indicating stream properties
(e.g., default, forced subtitles, visual impaired, etc.).

Direct mapping to AVStream->disposition.

##### Returns

`AVDisposition`

#### Set Signature

> **set** **disposition**(`value`): `void`

Defined in: [src/lib/stream.ts:196](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L196)

##### Parameters

###### value

`AVDisposition`

##### Returns

`void`

***

### duration

#### Get Signature

> **get** **duration**(): `bigint`

Defined in: [src/lib/stream.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L160)

Stream duration.

Total duration in stream time base units.
AV_NOPTS_VALUE if unknown.

Direct mapping to AVStream->duration.

##### Returns

`bigint`

#### Set Signature

> **set** **duration**(`value`): `void`

Defined in: [src/lib/stream.ts:164](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L164)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### eventFlags

#### Get Signature

> **get** **eventFlags**(): `AVStreamEventFlag`

Defined in: [src/lib/stream.ts:315](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L315)

Event flags.

Flags indicating events that happened to the stream.
Used for signaling format changes.

Direct mapping to AVStream->event_flags.

##### Returns

`AVStreamEventFlag`

#### Set Signature

> **set** **eventFlags**(`value`): `void`

Defined in: [src/lib/stream.ts:319](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L319)

##### Parameters

###### value

`AVStreamEventFlag`

##### Returns

`void`

***

### id

#### Get Signature

> **get** **id**(): `number`

Defined in: [src/lib/stream.ts:82](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L82)

Stream ID.

Format-specific stream identifier.
May be used by some formats for internal stream identification.

Direct mapping to AVStream->id.

##### Returns

`number`

#### Set Signature

> **set** **id**(`value`): `void`

Defined in: [src/lib/stream.ts:86](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L86)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### index

#### Get Signature

> **get** **index**(): `number`

Defined in: [src/lib/stream.ts:70](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L70)

Stream index.

Zero-based index of this stream in the format context.
Used to identify packets belonging to this stream.

Direct mapping to AVStream->index.

##### Returns

`number`

***

### metadata

#### Get Signature

> **get** **metadata**(): `null` \| [`Dictionary`](Dictionary.md)

Defined in: [src/lib/stream.ts:283](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L283)

Stream metadata.

Dictionary containing stream-specific metadata
(e.g., language, title, encoder settings).

Direct mapping to AVStream->metadata.

##### Returns

`null` \| [`Dictionary`](Dictionary.md)

#### Set Signature

> **set** **metadata**(`value`): `void`

Defined in: [src/lib/stream.ts:291](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L291)

##### Parameters

###### value

`null` | [`Dictionary`](Dictionary.md)

##### Returns

`void`

***

### nbFrames

#### Get Signature

> **get** **nbFrames**(): `bigint`

Defined in: [src/lib/stream.ts:176](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L176)

Number of frames.

Total number of frames in this stream.
0 if unknown.

Direct mapping to AVStream->nb_frames.

##### Returns

`bigint`

#### Set Signature

> **set** **nbFrames**(`value`): `void`

Defined in: [src/lib/stream.ts:180](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L180)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### rFrameRate

#### Get Signature

> **get** **rFrameRate**(): [`Rational`](Rational.md)

Defined in: [src/lib/stream.ts:262](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L262)

Real frame rate.

Real base frame rate of the stream.
This is the lowest common multiple of all frame rates in the stream.

Direct mapping to AVStream->r_frame_rate.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **rFrameRate**(`value`): `void`

Defined in: [src/lib/stream.ts:271](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L271)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### sampleAspectRatio

#### Get Signature

> **get** **sampleAspectRatio**(): [`Rational`](Rational.md)

Defined in: [src/lib/stream.ts:224](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L224)

Sample aspect ratio.

Pixel aspect ratio for video streams.
0/1 if unknown or not applicable.

Direct mapping to AVStream->sample_aspect_ratio.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **sampleAspectRatio**(`value`): `void`

Defined in: [src/lib/stream.ts:229](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L229)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### startTime

#### Get Signature

> **get** **startTime**(): `bigint`

Defined in: [src/lib/stream.ts:144](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L144)

Start time.

First timestamp of the stream in stream time base units.
AV_NOPTS_VALUE if unknown.

Direct mapping to AVStream->start_time.

##### Returns

`bigint`

#### Set Signature

> **set** **startTime**(`value`): `void`

Defined in: [src/lib/stream.ts:148](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L148)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### timeBase

#### Get Signature

> **get** **timeBase**(): [`Rational`](Rational.md)

Defined in: [src/lib/stream.ts:127](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L127)

Stream time base.

Unit of time for timestamps in this stream.
All timestamps (PTS/DTS) are in units of this time base.

Direct mapping to AVStream->time_base.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **timeBase**(`value`): `void`

Defined in: [src/lib/stream.ts:132](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L132)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

## Methods

### getNative()

> **getNative**(): `NativeStream`

Defined in: [src/lib/stream.ts:330](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/stream.ts#L330)

**`Internal`**

Get the underlying native Stream object.

#### Returns

`NativeStream`

The native Stream binding object

#### Implementation of

`NativeWrapper.getNative`
