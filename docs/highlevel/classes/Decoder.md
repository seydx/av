[node-av](../globals.md) / Decoder

# Class: Decoder

Defined in: [decoder.ts:50](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L50)

High-level decoder for audio and video streams.

Provides a simplified interface for decoding media streams from packets to frames.
Handles codec initialization, hardware acceleration setup, and frame management.
Supports both synchronous packet-by-packet decoding and async iteration over frames.
Essential component in media processing pipelines for converting compressed data to raw frames.

## Examples

```typescript
import { MediaInput, Decoder } from '@seydx/av/api';

// Open media and create decoder
await using input = await MediaInput.open('video.mp4');
using decoder = await Decoder.create(input.video());

// Decode frames
for await (const frame of decoder.frames(input.packets())) {
  console.log(`Decoded frame: ${frame.width}x${frame.height}`);
  frame.free();
}
```

```typescript
import { HardwareContext } from '@seydx/av/api';
import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';

// Setup hardware acceleration
const hw = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
using decoder = await Decoder.create(stream, { hardware: hw });

// Frames will be decoded on GPU
for await (const frame of decoder.frames(packets)) {
  // frame.hwFramesCtx contains GPU memory reference
}
```

## See

 - [Encoder](Encoder.md) For encoding frames to packets
 - [MediaInput](MediaInput.md) For reading media files
 - [HardwareContext](HardwareContext.md) For GPU acceleration

## Implements

- `Disposable`

## Accessors

### isDecoderOpen

#### Get Signature

> **get** **isDecoderOpen**(): `boolean`

Defined in: [decoder.ts:188](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L188)

Check if decoder is open.

##### Example

```typescript
if (decoder.isDecoderOpen) {
  const frame = await decoder.decode(packet);
}
```

##### Returns

`boolean`

true if decoder is open and ready

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [decoder.ts:620](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L620)

Dispose of decoder.

Implements Disposable interface for automatic cleanup.
Equivalent to calling close().

#### Returns

`void`

#### Example

```typescript
{
  using decoder = await Decoder.create(stream);
  // Decode frames...
} // Automatically closed
```

#### See

[close](#close) For manual cleanup

#### Implementation of

`Disposable.[dispose]`

***

### close()

> **close**(): `void`

Defined in: [decoder.ts:500](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L500)

Close decoder and free resources.

Releases codec context and internal frame buffer.
Safe to call multiple times.
Automatically called by Symbol.dispose.

#### Returns

`void`

#### Example

```typescript
const decoder = await Decoder.create(stream);
try {
  // Use decoder
} finally {
  decoder.close();
}
```

#### See

Symbol.dispose For automatic cleanup

***

### decode()

> **decode**(`packet`): `Promise`\<`null` \| `Frame`\>

Defined in: [decoder.ts:303](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L303)

Decode a packet to a frame.

Sends a packet to the decoder and attempts to receive a decoded frame.
Handles internal buffering - may return null if more packets needed.
Automatically manages decoder state and error recovery.

Direct mapping to avcodec_send_packet() and avcodec_receive_frame().

#### Parameters

##### packet

`Packet`

Compressed packet to decode

#### Returns

`Promise`\<`null` \| `Frame`\>

Decoded frame or null if more data needed

#### Throws

If decoder is closed

#### Throws

If decoding fails

#### Examples

```typescript
const frame = await decoder.decode(packet);
if (frame) {
  console.log(`Decoded frame with PTS: ${frame.pts}`);
  frame.free();
}
```

```typescript
for await (const packet of input.packets()) {
  if (packet.streamIndex === decoder.getStreamIndex()) {
    const frame = await decoder.decode(packet);
    if (frame) {
      await processFrame(frame);
      frame.free();
    }
  }
  packet.free();
}
```

#### See

 - [frames](#frames) For automatic packet iteration
 - [flush](#flush) For end-of-stream handling

***

### flush()

> **flush**(): `Promise`\<`null` \| `Frame`\>

Defined in: [decoder.ts:355](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L355)

Flush decoder and get buffered frame.

Signals end-of-stream and retrieves remaining frames.
Call repeatedly until null to get all buffered frames.
Essential for ensuring all frames are decoded.

Direct mapping to avcodec_send_packet(NULL).

#### Returns

`Promise`\<`null` \| `Frame`\>

Buffered frame or null if none remaining

#### Throws

If decoder is closed

#### Example

```typescript
// After all packets processed
let frame;
while ((frame = await decoder.flush()) !== null) {
  console.log('Got buffered frame');
  await processFrame(frame);
  frame.free();
}
```

#### See

 - [flushFrames](#flushframes) For async iteration
 - [frames](#frames) For complete decoding pipeline

***

### flushFrames()

> **flushFrames**(): `AsyncGenerator`\<`Frame`\>

Defined in: [decoder.ts:391](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L391)

Flush all buffered frames as async generator.

Convenient async iteration over remaining frames.
Automatically handles repeated flush calls.
Useful for end-of-stream processing.

#### Returns

`AsyncGenerator`\<`Frame`\>

#### Yields

Buffered frames

#### Throws

If decoder is closed

#### Example

```typescript
// Flush at end of decoding
for await (const frame of decoder.flushFrames()) {
  console.log('Processing buffered frame');
  await encoder.encode(frame);
  frame.free();
}
```

#### See

 - [flush](#flush) For single frame flush
 - [frames](#frames) For complete pipeline

***

### frames()

> **frames**(`packets`): `AsyncGenerator`\<`Frame`\>

Defined in: [decoder.ts:453](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L453)

Decode packet stream to frame stream.

High-level async generator for complete decoding pipeline.
Automatically filters packets for this stream, manages memory,
and flushes buffered frames at end.
Primary interface for stream-based decoding.

#### Parameters

##### packets

`AsyncIterable`\<`Packet`\>

Async iterable of packets

#### Returns

`AsyncGenerator`\<`Frame`\>

#### Yields

Decoded frames

#### Throws

If decoder is closed

#### Throws

If decoding fails

#### Examples

```typescript
await using input = await MediaInput.open('video.mp4');
using decoder = await Decoder.create(input.video());

for await (const frame of decoder.frames(input.packets())) {
  console.log(`Frame: ${frame.width}x${frame.height}`);
  frame.free();
}
```

```typescript
for await (const frame of decoder.frames(input.packets())) {
  // Process frame
  await filter.filterFrame(frame);

  // Frame automatically freed
  frame.free();
}
```

```typescript
import { pipeline } from '@seydx/av/api';

const control = pipeline(
  input,
  decoder,
  encoder,
  output
);
await control.completion;
```

#### See

 - [decode](#decode) For single packet decoding
 - [MediaInput.packets](MediaInput.md#packets) For packet source

***

### getCodecContext()

> **getCodecContext**(): `null` \| `CodecContext`

Defined in: [decoder.ts:564](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L564)

**`Internal`**

Get underlying codec context.

Returns the internal codec context for advanced operations.
Returns null if decoder is closed.

#### Returns

`null` \| `CodecContext`

Codec context or null

***

### getOutputStreamInfo()

> **getOutputStreamInfo**(): [`StreamInfo`](../type-aliases/StreamInfo.md)

Defined in: [decoder.ts:222](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L222)

Get output stream information.

Returns format information about decoded frames.
For hardware decoding, returns the hardware pixel format.
Essential for configuring downstream components like encoders or filters.

#### Returns

[`StreamInfo`](../type-aliases/StreamInfo.md)

Stream format information

#### Examples

```typescript
const info = decoder.getOutputStreamInfo();
if (info.type === 'video') {
  console.log(`Video: ${info.width}x${info.height} @ ${info.pixelFormat}`);
  console.log(`Frame rate: ${info.frameRate.num}/${info.frameRate.den}`);
}
```

```typescript
const info = decoder.getOutputStreamInfo();
if (info.type === 'audio') {
  console.log(`Audio: ${info.sampleRate}Hz ${info.sampleFormat}`);
  console.log(`Channels: ${info.channelLayout}`);
}
```

#### See

 - [StreamInfo](../type-aliases/StreamInfo.md) For format details
 - [Encoder.create](Encoder.md#create) For matching encoder configuration

***

### getStream()

> **getStream**(): `Stream`

Defined in: [decoder.ts:550](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L550)

Get stream object.

Returns the underlying stream being decoded.
Provides access to stream metadata and parameters.

#### Returns

`Stream`

Stream object

#### Example

```typescript
const stream = decoder.getStream();
console.log(`Duration: ${stream.duration}`);
console.log(`Time base: ${stream.timeBase.num}/${stream.timeBase.den}`);
```

#### See

 - Stream For stream properties
 - [getStreamIndex](#getstreamindex) For index only

***

### getStreamIndex()

> **getStreamIndex**(): `number`

Defined in: [decoder.ts:528](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L528)

Get stream index.

Returns the index of the stream being decoded.
Used for packet filtering in multi-stream files.

#### Returns

`number`

Stream index

#### Example

```typescript
if (packet.streamIndex === decoder.getStreamIndex()) {
  const frame = await decoder.decode(packet);
}
```

#### See

[getStream](#getstream) For full stream object

***

### isHardware()

> **isHardware**(): `boolean`

Defined in: [decoder.ts:258](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L258)

Check if decoder uses hardware acceleration.

#### Returns

`boolean`

true if hardware-accelerated

#### Example

```typescript
if (decoder.isHardware()) {
  console.log('Using GPU acceleration');
}
```

#### See

[HardwareContext](HardwareContext.md) For hardware setup

***

### create()

> `static` **create**(`stream`, `options`): `Promise`\<`Decoder`\>

Defined in: [decoder.ts:120](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/decoder.ts#L120)

Create a decoder for a media stream.

Initializes a decoder with the appropriate codec and configuration.
Automatically detects and configures hardware acceleration if provided.
Applies custom codec options and threading configuration.

#### Parameters

##### stream

`Stream`

Media stream to decode

##### options

[`DecoderOptions`](../interfaces/DecoderOptions.md) = `{}`

Decoder configuration options

#### Returns

`Promise`\<`Decoder`\>

Configured decoder instance

#### Throws

If decoder not found for codec

#### Throws

If codec initialization fails

#### Examples

```typescript
import { MediaInput, Decoder } from '@seydx/av/api';

await using input = await MediaInput.open('video.mp4');
using decoder = await Decoder.create(input.video());
```

```typescript
using decoder = await Decoder.create(stream, {
  threads: 4,
  options: {
    'refcounted_frames': '1',
    'skip_frame': 'nonkey'  // Only decode keyframes
  }
});
```

```typescript
const hw = HardwareContext.auto();
using decoder = await Decoder.create(stream, {
  hardware: hw,
  threads: 0  // Auto-detect thread count
});
```

#### See

 - [HardwareContext](HardwareContext.md) For GPU acceleration setup
 - [DecoderOptions](../interfaces/DecoderOptions.md) For configuration options
