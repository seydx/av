[node-av](../globals.md) / Encoder

# Class: Encoder

Defined in: [encoder.ts:68](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L68)

High-level encoder for audio and video streams.

Provides a simplified interface for encoding media frames to packets.
Handles codec initialization, hardware acceleration setup, and packet management.
Supports both synchronous frame-by-frame encoding and async iteration over packets.
Essential component in media processing pipelines for converting raw frames to compressed data.

## Examples

```typescript
import { Encoder } from '@seydx/av/api';
import { AV_CODEC_ID_H264 } from '@seydx/av/constants';

// Create H.264 encoder
const encoder = await Encoder.create('libx264', {
  type: 'video',
  width: 1920,
  height: 1080,
  pixelFormat: AV_PIX_FMT_YUV420P,
  timeBase: { num: 1, den: 30 },
  frameRate: { num: 30, den: 1 }
}, {
  bitrate: '5M',
  gopSize: 60
});

// Encode frames
const packet = await encoder.encode(frame);
if (packet) {
  await output.writePacket(packet);
  packet.free();
}
```

```typescript
// Hardware-accelerated encoding
import { HardwareContext } from '@seydx/av/api';
import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';

const hw = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
const encoder = await Encoder.create('h264_nvenc', streamInfo, {
  hardware: hw,
  bitrate: '10M'
});

// Frames with hw_frames_ctx will be encoded on GPU
for await (const packet of encoder.packets(frames)) {
  await output.writePacket(packet);
  packet.free();
}
```

## See

 - [Decoder](Decoder.md) For decoding packets to frames
 - [MediaOutput](MediaOutput.md) For writing encoded packets
 - [HardwareContext](HardwareContext.md) For GPU acceleration

## Implements

- `Disposable`

## Accessors

### isEncoderOpen

#### Get Signature

> **get** **isEncoderOpen**(): `boolean`

Defined in: [encoder.ts:279](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L279)

Check if encoder is open.

##### Example

```typescript
if (encoder.isEncoderOpen) {
  const packet = await encoder.encode(frame);
}
```

##### Returns

`boolean`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [encoder.ts:639](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L639)

Dispose of encoder.

Implements Disposable interface for automatic cleanup.
Equivalent to calling close().

#### Returns

`void`

#### Example

```typescript
{
  using encoder = await Encoder.create('libx264', streamInfo);
  // Encode frames...
} // Automatically closed
```

#### See

[close](#close) For manual cleanup

#### Implementation of

`Disposable.[dispose]`

***

### close()

> **close**(): `void`

Defined in: [encoder.ts:548](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L548)

Close encoder and free resources.

Releases codec context and internal packet buffer.
Safe to call multiple times.
Does NOT dispose hardware context - caller is responsible.
Automatically called by Symbol.dispose.

#### Returns

`void`

#### Example

```typescript
const encoder = await Encoder.create('libx264', streamInfo);
try {
  // Use encoder
} finally {
  encoder.close();
}
```

#### See

Symbol.dispose For automatic cleanup

***

### encode()

> **encode**(`frame`): `Promise`\<`null` \| `Packet`\>

Defined in: [encoder.ts:342](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L342)

Encode a frame to a packet.

Sends a frame to the encoder and attempts to receive an encoded packet.
Handles internal buffering - may return null if more frames needed.
Automatically manages encoder state and hardware context binding.

Direct mapping to avcodec_send_frame() and avcodec_receive_packet().

#### Parameters

##### frame

Raw frame to encode (or null to flush)

`null` | `Frame`

#### Returns

`Promise`\<`null` \| `Packet`\>

Encoded packet or null if more data needed

#### Throws

If encoder is closed

#### Throws

If encoding fails

#### Examples

```typescript
const packet = await encoder.encode(frame);
if (packet) {
  console.log(`Encoded packet with PTS: ${packet.pts}`);
  await output.writePacket(packet);
  packet.free();
}
```

```typescript
// Encode loop
for await (const frame of decoder.frames(input.packets())) {
  const packet = await encoder.encode(frame);
  if (packet) {
    await output.writePacket(packet);
    packet.free();
  }
  frame.free();
}
```

#### See

 - [packets](#packets) For automatic frame iteration
 - [flush](#flush) For end-of-stream handling

***

### flush()

> **flush**(): `Promise`\<`null` \| `Packet`\>

Defined in: [encoder.ts:482](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L482)

Flush encoder and get buffered packet.

Signals end-of-stream and retrieves remaining packets.
Call repeatedly until null to get all buffered packets.
Essential for ensuring all frames are encoded.

Direct mapping to avcodec_send_frame(NULL).

#### Returns

`Promise`\<`null` \| `Packet`\>

Buffered packet or null if none remaining

#### Throws

If encoder is closed

#### Example

```typescript
// Flush remaining packets
let packet;
while ((packet = await encoder.flush()) !== null) {
  console.log('Got buffered packet');
  await output.writePacket(packet);
  packet.free();
}
```

#### See

 - [flushPackets](#flushpackets) For async iteration
 - [packets](#packets) For complete encoding pipeline

***

### flushPackets()

> **flushPackets**(): `AsyncGenerator`\<`Packet`\>

Defined in: [encoder.ts:517](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L517)

Flush all buffered packets as async generator.

Convenient async iteration over remaining packets.
Automatically handles repeated flush calls.
Useful for end-of-stream processing.

#### Returns

`AsyncGenerator`\<`Packet`\>

#### Yields

Buffered packets

#### Throws

If encoder is closed

#### Example

```typescript
// Flush at end of encoding
for await (const packet of encoder.flushPackets()) {
  console.log('Processing buffered packet');
  await output.writePacket(packet);
  packet.free();
}
```

#### See

 - [flush](#flush) For single packet flush
 - [packets](#packets) For complete pipeline

***

### getCodec()

> **getCodec**(): `Codec`

Defined in: [encoder.ts:574](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L574)

Get encoder codec.

Returns the codec used by this encoder.
Useful for checking codec capabilities and properties.

#### Returns

`Codec`

Codec instance

#### Example

```typescript
const codec = encoder.getCodec();
console.log(`Using codec: ${codec.name}`);
console.log(`Capabilities: ${codec.capabilities}`);
```

#### See

Codec For codec properties

***

### getCodecContext()

> **getCodecContext**(): `null` \| `CodecContext`

Defined in: [encoder.ts:588](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L588)

**`Internal`**

Get underlying codec context.

Returns the internal codec context for advanced operations.
Returns null if encoder is closed.

#### Returns

`null` \| `CodecContext`

Codec context or null

***

### isHardware()

> **isHardware**(): `boolean`

Defined in: [encoder.ts:297](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L297)

Check if encoder uses hardware acceleration.

#### Returns

`boolean`

true if hardware-accelerated

#### Example

```typescript
if (encoder.isHardware()) {
  console.log('Using GPU acceleration');
}
```

#### See

[HardwareContext](HardwareContext.md) For hardware setup

***

### packets()

> **packets**(`frames`): `AsyncGenerator`\<`Packet`\>

Defined in: [encoder.ts:430](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L430)

Encode frame stream to packet stream.

High-level async generator for complete encoding pipeline.
Automatically manages frame memory, encoder state,
and flushes buffered packets at end.
Primary interface for stream-based encoding.

#### Parameters

##### frames

`AsyncIterable`\<`Frame`\>

Async iterable of frames (freed automatically)

#### Returns

`AsyncGenerator`\<`Packet`\>

#### Yields

Encoded packets (caller must free)

#### Throws

If encoder is closed

#### Throws

If encoding fails

#### Examples

```typescript
// Basic encoding pipeline
for await (const packet of encoder.packets(decoder.frames(input.packets()))) {
  await output.writePacket(packet);
  packet.free(); // Must free output packets
}
```

```typescript
// With frame filtering
async function* filteredFrames() {
  for await (const frame of decoder.frames(input.packets())) {
    await filter.filterFrame(frame);
    const filtered = await filter.getFrame();
    if (filtered) {
      yield filtered;
    }
  }
}

for await (const packet of encoder.packets(filteredFrames())) {
  await output.writePacket(packet);
  packet.free();
}
```

```typescript
// Pipeline integration
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

 - [encode](#encode) For single frame encoding
 - [Decoder.frames](Decoder.md#frames) For frame source

***

### create()

> `static` **create**(`encoderCodec`, `input`, `options`): `Promise`\<`Encoder`\>

Defined in: [encoder.ts:147](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/encoder.ts#L147)

Create an encoder with specified codec and options.

Initializes an encoder with the appropriate codec and configuration.
Automatically configures parameters based on input stream info.
Handles hardware acceleration setup if provided.

Direct mapping to avcodec_find_encoder_by_name() or avcodec_find_encoder().

#### Parameters

##### encoderCodec

Codec name, ID, or instance to use for encoding

`AVCodecID` | `FFEncoderCodec` | `Codec`

##### input

[`StreamInfo`](../type-aliases/StreamInfo.md)

Stream information to configure encoder

##### options

[`EncoderOptions`](../interfaces/EncoderOptions.md) = `{}`

Encoder configuration options

#### Returns

`Promise`\<`Encoder`\>

Configured encoder instance

#### Throws

If encoder not found or unsupported format

#### Throws

If codec initialization fails

#### Examples

```typescript
// From decoder stream info
const streamInfo = decoder.getOutputStreamInfo();
const encoder = await Encoder.create('libx264', streamInfo, {
  bitrate: '5M',
  gopSize: 60,
  options: {
    preset: 'fast',
    crf: '23'
  }
});
```

```typescript
// With custom stream info
const encoder = await Encoder.create('aac', {
  type: 'audio',
  sampleRate: 48000,
  sampleFormat: AV_SAMPLE_FMT_FLTP,
  channelLayout: AV_CH_LAYOUT_STEREO,
  timeBase: { num: 1, den: 48000 }
}, {
  bitrate: '192k'
});
```

```typescript
// Hardware encoder
const hw = HardwareContext.auto();
const encoder = await Encoder.create('hevc_videotoolbox', streamInfo, {
  hardware: hw,
  bitrate: '8M'
});
```

#### See

 - [Decoder.getOutputStreamInfo](Decoder.md#getoutputstreaminfo) For stream info source
 - [EncoderOptions](../interfaces/EncoderOptions.md) For configuration options
