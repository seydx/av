[node-av](../globals.md) / MediaOutput

# Class: MediaOutput

Defined in: [media-output.ts:67](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L67)

High-level media output for writing and muxing media files.

Provides simplified access to media muxing and file writing operations.
Handles stream configuration, packet writing, and format management.
Supports files, URLs, and custom I/O with automatic cleanup.
Essential component for media encoding pipelines and transcoding.

## Examples

```typescript
import { MediaOutput } from '@seydx/av/api';

// Create output file
await using output = await MediaOutput.open('output.mp4');

// Add streams from encoders
const videoIdx = output.addStream(videoEncoder);
const audioIdx = output.addStream(audioEncoder);

// Write header
await output.writeHeader();

// Write packets
await output.writePacket(packet, videoIdx);

// Write trailer and close
await output.writeTrailer();
```

```typescript
// Stream copy
await using input = await MediaInput.open('input.mp4');
await using output = await MediaOutput.open('output.mp4');

// Copy stream configuration
const videoIdx = output.addStream(input.video());
await output.writeHeader();

for await (const packet of input.packets()) {
  await output.writePacket(packet, videoIdx);
  packet.free();
}
```

## See

 - [MediaInput](MediaInput.md) For reading media files
 - [Encoder](Encoder.md) For encoding frames to packets
 - FormatContext For low-level API

## Implements

- `AsyncDisposable`

## Methods

### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

Defined in: [media-output.ts:631](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L631)

Dispose of media output.

Implements AsyncDisposable interface for automatic cleanup.
Equivalent to calling close().

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
{
  await using output = await MediaOutput.open('output.mp4');
  // Use output...
} // Automatically closed
```

#### See

[close](#close) For manual cleanup

#### Implementation of

`AsyncDisposable.[asyncDispose]`

***

### addStream()

> **addStream**(`source`, `options?`): `number`

Defined in: [media-output.ts:245](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L245)

Add a stream to the output.

Configures output stream from encoder or input stream.
Must be called before writeHeader().
Returns stream index for packet writing.

Direct mapping to avformat_new_stream() and avcodec_parameters_copy().

#### Parameters

##### source

Encoder or stream to add

`Stream` | [`Encoder`](Encoder.md)

##### options?

Stream configuration options

###### timeBase?

`IRational`

Optional custom timebase for the stream

#### Returns

`number`

Stream index for packet writing

#### Throws

If called after header written or output closed

#### Examples

```typescript
// Add stream from encoder
const videoIdx = output.addStream(videoEncoder);
const audioIdx = output.addStream(audioEncoder);
```

```typescript
// Stream copy with custom timebase
const streamIdx = output.addStream(input.video(), {
  timeBase: { num: 1, den: 90000 }
});
```

#### See

 - [writePacket](#writepacket) For writing packets to streams
 - [Encoder](Encoder.md) For transcoding source

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [media-output.ts:482](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L482)

Close media output and free resources.

Writes trailer if needed and releases all resources.
Safe to call multiple times.
Automatically called by Symbol.asyncDispose.

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
const output = await MediaOutput.open('output.mp4');
try {
  // Use output
} finally {
  await output.close();
}
```

#### See

Symbol.asyncDispose For automatic cleanup

***

### getFormatContext()

> **getFormatContext**(): `FormatContext`

Defined in: [media-output.ts:611](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L611)

**`Internal`**

Get underlying format context.

Returns the internal format context for advanced operations.

#### Returns

`FormatContext`

Format context

***

### getStreamIndices()

> **getStreamIndices**(): `number`[]

Defined in: [media-output.ts:566](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L566)

Get all stream indices.

Returns array of all added stream indices.

#### Returns

`number`[]

Array of stream indices

#### Example

```typescript
const indices = output.getStreamIndices();
console.log(`Output has ${indices.length} streams`);
```

***

### getStreamInfo()

> **getStreamInfo**(`streamIndex`): `undefined` \| `StreamInfo`

Defined in: [media-output.ts:549](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L549)

Get stream information.

Returns internal stream info for the specified index.

#### Parameters

##### streamIndex

`number`

Stream index

#### Returns

`undefined` \| `StreamInfo`

Stream info or undefined

#### Example

```typescript
const info = output.getStreamInfo(0);
console.log(`Stream 0 timebase: ${info?.timeBase.num}/${info?.timeBase.den}`);
```

***

### isHeaderWritten()

> **isHeaderWritten**(): `boolean`

Defined in: [media-output.ts:582](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L582)

Check if header has been written.

#### Returns

`boolean`

true if header written

#### Example

```typescript
if (!output.isHeaderWritten()) {
  await output.writeHeader();
}
```

***

### isTrailerWritten()

> **isTrailerWritten**(): `boolean`

Defined in: [media-output.ts:598](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L598)

Check if trailer has been written.

#### Returns

`boolean`

true if trailer written

#### Example

```typescript
if (!output.isTrailerWritten()) {
  await output.writeTrailer();
}
```

***

### writeHeader()

> **writeHeader**(): `Promise`\<`void`\>

Defined in: [media-output.ts:409](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L409)

Write file header.

Writes format header with stream configuration.
Must be called after adding all streams and before writing packets.
Finalizes stream parameters and initializes muxer.

Direct mapping to avformat_write_header().

#### Returns

`Promise`\<`void`\>

#### Throws

If already written or output closed

#### Throws

If write fails

#### Example

```typescript
// Standard workflow
const output = await MediaOutput.open('output.mp4');
output.addStream(encoder);
await output.writeHeader();
// Now ready to write packets
```

#### See

 - [addStream](#addstream) Must add streams first
 - [writePacket](#writepacket) Can write packets after
 - [writeTrailer](#writetrailer) Must call at end

***

### writePacket()

> **writePacket**(`packet`, `streamIndex`): `Promise`\<`void`\>

Defined in: [media-output.ts:344](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L344)

Write a packet to the output.

Writes muxed packet to the specified stream.
Automatically handles timestamp rescaling.
Must be called after writeHeader() and before writeTrailer().

Direct mapping to av_interleaved_write_frame().

#### Parameters

##### packet

`Packet`

Packet to write

##### streamIndex

`number`

Target stream index

#### Returns

`Promise`\<`void`\>

#### Throws

If stream invalid or called at wrong time

#### Throws

If write fails

#### Examples

```typescript
// Write encoded packet
const packet = await encoder.encode(frame);
if (packet) {
  await output.writePacket(packet, videoIdx);
  packet.free();
}
```

```typescript
// Stream copy with packet processing
for await (const packet of input.packets()) {
  if (packet.streamIndex === inputVideoIdx) {
    await output.writePacket(packet, outputVideoIdx);
  }
  packet.free();
}
```

#### See

 - [addStream](#addstream) For adding streams
 - [writeHeader](#writeheader) Must be called first

***

### writeTrailer()

> **writeTrailer**(): `Promise`\<`void`\>

Defined in: [media-output.ts:445](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L445)

Write file trailer.

Writes format trailer and finalizes the file.
Must be called after all packets are written.
Flushes any buffered data and updates file headers.

Direct mapping to av_write_trailer().

#### Returns

`Promise`\<`void`\>

#### Throws

If header not written or already written

#### Throws

If write fails

#### Example

```typescript
// Finalize output
await output.writeTrailer();
await output.close();
```

#### See

 - [writeHeader](#writeheader) Must be called first
 - [close](#close) For cleanup after trailer

***

### open()

> `static` **open**(`target`, `options?`): `Promise`\<`MediaOutput`\>

Defined in: [media-output.ts:135](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-output.ts#L135)

Open media output for writing.

Creates and configures output context for muxing.
Automatically creates directories for file output.
Supports files, URLs, and custom I/O callbacks.

Direct mapping to avformat_alloc_output_context2() and avio_open2().

#### Parameters

##### target

File path, URL, or I/O callbacks

`string` | [`IOOutputCallbacks`](../interfaces/IOOutputCallbacks.md)

##### options?

[`MediaOutputOptions`](../interfaces/MediaOutputOptions.md)

Output configuration options

#### Returns

`Promise`\<`MediaOutput`\>

Opened media output instance

#### Throws

If format required for custom I/O

#### Throws

If allocation or opening fails

#### Examples

```typescript
// Create file output
await using output = await MediaOutput.open('output.mp4');
```

```typescript
// Create output with specific format
await using output = await MediaOutput.open('output.ts', {
  format: 'mpegts'
});
```

```typescript
// Custom I/O callbacks
const callbacks = {
  write: async (buffer: Buffer) => {
    // Write to custom destination
    return buffer.length;
  },
  seek: async (offset: bigint, whence: number) => {
    // Seek in custom destination
    return offset;
  }
};

await using output = await MediaOutput.open(callbacks, {
  format: 'mp4',
  bufferSize: 8192
});
```

#### See

 - [MediaOutputOptions](../interfaces/MediaOutputOptions.md) For configuration options
 - [IOOutputCallbacks](../interfaces/IOOutputCallbacks.md) For custom I/O interface
