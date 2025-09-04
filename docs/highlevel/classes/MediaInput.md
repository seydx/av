[node-av](../globals.md) / MediaInput

# Class: MediaInput

Defined in: [media-input.ts:51](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L51)

High-level media input for reading and demuxing media files.

Provides simplified access to media streams, packets, and metadata.
Handles file opening, format detection, and stream information extraction.
Supports files, URLs, buffers, and raw data input with automatic cleanup.
Essential component for media processing pipelines and transcoding.

## Examples

```typescript
import { MediaInput } from '@seydx/av/api';

// Open media file
await using input = await MediaInput.open('video.mp4');
console.log(`Format: ${input.formatName}`);
console.log(`Duration: ${input.duration}s`);

// Process packets
for await (const packet of input.packets()) {
  console.log(`Packet from stream ${packet.streamIndex}`);
  packet.free();
}
```

```typescript
// From buffer
const buffer = await fs.readFile('video.mp4');
await using input = await MediaInput.open(buffer);

// Access streams
const videoStream = input.video();
const audioStream = input.audio();
```

## See

 - [MediaOutput](MediaOutput.md) For writing media files
 - [Decoder](Decoder.md) For decoding packets to frames
 - FormatContext For low-level API

## Implements

- `AsyncDisposable`

## Accessors

### bitRate

#### Get Signature

> **get** **bitRate**(): `number`

Defined in: [media-input.ts:360](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L360)

Get media bitrate in kilobits per second.

Returns 0 if bitrate is unknown.

##### Example

```typescript
console.log(`Bitrate: ${input.bitRate} kbps`);
```

##### Returns

`number`

***

### duration

#### Get Signature

> **get** **duration**(): `number`

Defined in: [media-input.ts:343](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L343)

Get media duration in seconds.

Returns 0 if duration is unknown or not available.

##### Example

```typescript
console.log(`Duration: ${input.duration} seconds`);
```

##### Returns

`number`

***

### formatLongName

#### Get Signature

> **get** **formatLongName**(): `string`

Defined in: [media-input.ts:403](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L403)

Get format long name.

##### Example

```typescript
console.log(`Format: ${input.formatLongName}`); // "QuickTime / MOV"
```

##### Returns

`string`

***

### formatName

#### Get Signature

> **get** **formatName**(): `string`

Defined in: [media-input.ts:391](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L391)

Get format name.

##### Example

```typescript
console.log(`Format: ${input.formatName}`); // "mov,mp4,m4a,3gp,3g2,mj2"
```

##### Returns

`string`

***

### metadata

#### Get Signature

> **get** **metadata**(): `Record`\<`string`, `string`\>

Defined in: [media-input.ts:379](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L379)

Get media metadata.

Returns all metadata tags as key-value pairs.

##### Example

```typescript
const metadata = input.metadata;
console.log(`Title: ${metadata.title}`);
console.log(`Artist: ${metadata.artist}`);
```

##### Returns

`Record`\<`string`, `string`\>

***

### streams

#### Get Signature

> **get** **streams**(): `Stream`[]

Defined in: [media-input.ts:329](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L329)

Get all streams in the media.

##### Example

```typescript
for (const stream of input.streams) {
  console.log(`Stream ${stream.index}: ${stream.codecpar.codecType}`);
}
```

##### Returns

`Stream`[]

## Methods

### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

Defined in: [media-input.ts:667](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L667)

Dispose of media input.

Implements AsyncDisposable interface for automatic cleanup.
Equivalent to calling close().

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
{
  await using input = await MediaInput.open('video.mp4');
  // Process media...
} // Automatically closed
```

#### See

[close](#close) For manual cleanup

#### Implementation of

`AsyncDisposable.[asyncDispose]`

***

### audio()

> **audio**(`index`): `undefined` \| `Stream`

Defined in: [media-input.ts:464](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L464)

Get audio stream by index.

Returns the nth audio stream (0-based index).
Returns undefined if stream doesn't exist.

#### Parameters

##### index

`number` = `0`

Audio stream index (default: 0)

#### Returns

`undefined` \| `Stream`

Audio stream or undefined

#### Examples

```typescript
const audioStream = input.audio();
if (audioStream) {
  console.log(`Audio: ${audioStream.codecpar.sampleRate}Hz`);
}
```

```typescript
// Get second audio stream
const secondAudio = input.audio(1);
```

#### See

 - [video](#video) For video streams
 - [findBestStream](#findbeststream) For automatic selection

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [media-input.ts:622](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L622)

Close media input and free resources.

Releases format context and I/O context.
Safe to call multiple times.
Automatically called by Symbol.asyncDispose.

Direct mapping to avformat_close_input().

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
const input = await MediaInput.open('video.mp4');
try {
  // Use input
} finally {
  await input.close();
}
```

#### See

Symbol.asyncDispose For automatic cleanup

***

### findBestStream()

> **findBestStream**(`type`): `undefined` \| `Stream`

Defined in: [media-input.ts:493](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L493)

Find the best stream of a given type.

Uses FFmpeg's stream selection algorithm.
Considers codec support, default flags, and quality.

Direct mapping to av_find_best_stream().

#### Parameters

##### type

`AVMediaType`

Media type to find

#### Returns

`undefined` \| `Stream`

Best stream or undefined if not found

#### Example

```typescript
import { AVMEDIA_TYPE_VIDEO } from '@seydx/av/constants';

const bestVideo = input.findBestStream(AVMEDIA_TYPE_VIDEO);
if (bestVideo) {
  const decoder = await Decoder.create(bestVideo);
}
```

#### See

 - [video](#video) For direct video stream access
 - [audio](#audio) For direct audio stream access

***

### getFormatContext()

> **getFormatContext**(): `FormatContext`

Defined in: [media-input.ts:647](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L647)

**`Internal`**

Get underlying format context.

Returns the internal format context for advanced operations.

#### Returns

`FormatContext`

Format context

***

### packets()

> **packets**(`index?`): `AsyncGenerator`\<`Packet`\>

Defined in: [media-input.ts:532](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L532)

Read packets from media as async generator.

Yields demuxed packets for processing.
Automatically handles packet memory management.
Optionally filters packets by stream index.

Direct mapping to av_read_frame().

#### Parameters

##### index?

`number`

Optional stream index to filter

#### Returns

`AsyncGenerator`\<`Packet`\>

#### Yields

Demuxed packets (must be freed by caller)

#### Throws

If packet cloning fails

#### Examples

```typescript
// Read all packets
for await (const packet of input.packets()) {
  console.log(`Packet: stream=${packet.streamIndex}, pts=${packet.pts}`);
  packet.free();
}
```

```typescript
// Read only video packets
const videoStream = input.video();
for await (const packet of input.packets(videoStream.index)) {
  // Process video packet
  packet.free();
}
```

#### See

[Decoder.frames](Decoder.md#frames) For decoding packets

***

### seek()

> **seek**(`timestamp`, `streamIndex`, `flags`): `Promise`\<`number`\>

Defined in: [media-input.ts:595](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L595)

Seek to timestamp in media.

Seeks to the specified position in seconds.
Can seek in specific stream or globally.

Direct mapping to av_seek_frame().

#### Parameters

##### timestamp

`number`

Target position in seconds

##### streamIndex

`number` = `-1`

Stream index or -1 for global (default: -1)

##### flags

`AVSeekFlag` = `AVFLAG_NONE`

Seek flags (default: AVFLAG_NONE)

#### Returns

`Promise`\<`number`\>

0 on success, negative on error

#### Examples

```typescript
// Seek to 30 seconds
const ret = await input.seek(30);
FFmpegError.throwIfError(ret, 'seek failed');
```

```typescript
import { AVSEEK_FLAG_BACKWARD } from '@seydx/av/constants';

// Seek to keyframe before 60 seconds
await input.seek(60, -1, AVSEEK_FLAG_BACKWARD);
```

#### See

AVSeekFlag For seek flags

***

### video()

> **video**(`index`): `undefined` \| `Stream`

Defined in: [media-input.ts:433](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L433)

Get video stream by index.

Returns the nth video stream (0-based index).
Returns undefined if stream doesn't exist.

#### Parameters

##### index

`number` = `0`

Video stream index (default: 0)

#### Returns

`undefined` \| `Stream`

Video stream or undefined

#### Examples

```typescript
const videoStream = input.video();
if (videoStream) {
  console.log(`Video: ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
}
```

```typescript
// Get second video stream
const secondVideo = input.video(1);
```

#### See

 - [audio](#audio) For audio streams
 - [findBestStream](#findbeststream) For automatic selection

***

### open()

#### Call Signature

> `static` **open**(`input`, `options?`): `Promise`\<`MediaInput`\>

Defined in: [media-input.ts:207](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L207)

Open media from file, URL, buffer, or raw data.

Automatically detects format and extracts stream information.
Supports various input sources with flexible configuration.
Creates demuxer ready for packet extraction.

Direct mapping to avformat_open_input() and avformat_find_stream_info().

##### Parameters

###### input

File path, URL, buffer, or raw data descriptor

`string` | `Buffer`\<`ArrayBufferLike`\>

###### options?

[`MediaInputOptions`](../interfaces/MediaInputOptions.md)

Input configuration options

##### Returns

`Promise`\<`MediaInput`\>

Opened media input instance

##### Throws

If format not found or open fails

##### Throws

If FFmpeg operations fail

##### Examples

```typescript
// Open file
await using input = await MediaInput.open('video.mp4');
```

```typescript
// Open URL
await using input = await MediaInput.open('http://example.com/stream.m3u8');
```

```typescript
// Open with options
await using input = await MediaInput.open('rtsp://camera.local', {
  format: 'rtsp',
  options: {
    rtsp_transport: 'tcp',
    analyzeduration: '5000000'
  }
});
```

```typescript
// Open raw video data
await using input = await MediaInput.open({
  type: 'video',
  input: rawBuffer,
  width: 1920,
  height: 1080,
  pixelFormat: AV_PIX_FMT_YUV420P,
  frameRate: { num: 30, den: 1 }
});
```

##### See

 - [MediaInputOptions](../interfaces/MediaInputOptions.md) For configuration options
 - [RawData](../type-aliases/RawData.md) For raw data input

#### Call Signature

> `static` **open**(`rawData`, `options?`): `Promise`\<`MediaInput`\>

Defined in: [media-input.ts:208](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L208)

Open media from file, URL, buffer, or raw data.

Automatically detects format and extracts stream information.
Supports various input sources with flexible configuration.
Creates demuxer ready for packet extraction.

Direct mapping to avformat_open_input() and avformat_find_stream_info().

##### Parameters

###### rawData

[`RawData`](../type-aliases/RawData.md)

###### options?

[`MediaInputOptions`](../interfaces/MediaInputOptions.md)

Input configuration options

##### Returns

`Promise`\<`MediaInput`\>

Opened media input instance

##### Throws

If format not found or open fails

##### Throws

If FFmpeg operations fail

##### Examples

```typescript
// Open file
await using input = await MediaInput.open('video.mp4');
```

```typescript
// Open URL
await using input = await MediaInput.open('http://example.com/stream.m3u8');
```

```typescript
// Open with options
await using input = await MediaInput.open('rtsp://camera.local', {
  format: 'rtsp',
  options: {
    rtsp_transport: 'tcp',
    analyzeduration: '5000000'
  }
});
```

```typescript
// Open raw video data
await using input = await MediaInput.open({
  type: 'video',
  input: rawBuffer,
  width: 1920,
  height: 1080,
  pixelFormat: AV_PIX_FMT_YUV420P,
  frameRate: { num: 30, den: 1 }
});
```

##### See

 - [MediaInputOptions](../interfaces/MediaInputOptions.md) For configuration options
 - [RawData](../type-aliases/RawData.md) For raw data input

***

### probeFormat()

> `static` **probeFormat**(`input`): `Promise`\<`null` \| \{ `confidence`: `number`; `extensions?`: `string`; `format`: `string`; `longName?`: `string`; `mimeType?`: `string`; \}\>

Defined in: [media-input.ts:94](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/media-input.ts#L94)

Probe media format without fully opening the file.

Detects format by analyzing file headers and content.
Useful for format validation before processing.

Direct mapping to av_probe_input_format().

#### Parameters

##### input

File path or buffer to probe

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`null` \| \{ `confidence`: `number`; `extensions?`: `string`; `format`: `string`; `longName?`: `string`; `mimeType?`: `string`; \}\>

Format information or null if unrecognized

#### Examples

```typescript
const info = await MediaInput.probeFormat('video.mp4');
if (info) {
  console.log(`Format: ${info.format}`);
  console.log(`Confidence: ${info.confidence}%`);
}
```

```typescript
// Probe from buffer
const buffer = await fs.readFile('video.webm');
const info = await MediaInput.probeFormat(buffer);
console.log(`MIME type: ${info?.mimeType}`);
```

#### See

InputFormat.probe For low-level probing
