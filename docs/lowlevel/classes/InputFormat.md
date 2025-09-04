[node-av](../globals.md) / InputFormat

# Class: InputFormat

Defined in: [src/lib/input-format.ts:46](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L46)

Input format descriptor for demuxing media files.

Represents a demuxer that can read and parse specific media container formats.
Each format handles specific file types (e.g., MP4, MKV, AVI) and knows how to
extract streams and packets from them. Used to identify and open media files
for reading.

Direct mapping to FFmpeg's AVInputFormat.

## Example

```typescript
import { InputFormat, FormatContext, FFmpegError } from 'node-av';

// Find format by name
const mp4Format = InputFormat.findInputFormat('mp4');
if (mp4Format) {
  console.log(`Format: ${mp4Format.name}`);
  console.log(`Description: ${mp4Format.longName}`);
  console.log(`Extensions: ${mp4Format.extensions}`);
}

// Probe format from file data
const fileData = Buffer.from([...]); // First few KB of file
const detectedFormat = InputFormat.probe(fileData, 'video.mp4');
if (detectedFormat) {
  console.log(`Detected: ${detectedFormat.name}`);
}

// Use with format context
const formatContext = new FormatContext();
formatContext.inputFormat = mp4Format;
const ret = await formatContext.openInput('video.mp4');
FFmpegError.throwIfError(ret, 'openInput');
```

## See

 - \[AVInputFormat\](https://ffmpeg.org/doxygen/trunk/structAVInputFormat.html)
 - [FormatContext](FormatContext.md) For using formats to open files
 - [OutputFormat](OutputFormat.md) For muxing formats

## Implements

- `NativeWrapper`\<`NativeInputFormat`\>

## Constructors

### Constructor

> **new InputFormat**(`native`): `InputFormat`

Defined in: [src/lib/input-format.ts:53](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L53)

**`Internal`**

#### Parameters

##### native

`NativeInputFormat`

The native input format instance

#### Returns

`InputFormat`

## Accessors

### extensions

#### Get Signature

> **get** **extensions**(): `null` \| `string`

Defined in: [src/lib/input-format.ts:195](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L195)

File extensions.

Comma-separated list of file extensions for this format.

Direct mapping to AVInputFormat->extensions.

##### Returns

`null` \| `string`

***

### flags

#### Get Signature

> **get** **flags**(): `AVFormatFlag`

Defined in: [src/lib/input-format.ts:217](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L217)

Format flags.

Combination of AVFMT_* flags indicating format capabilities.

Direct mapping to AVInputFormat->flags.

##### Returns

`AVFormatFlag`

***

### longName

#### Get Signature

> **get** **longName**(): `null` \| `string`

Defined in: [src/lib/input-format.ts:184](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L184)

Format long name.

Human-readable description of the format.

Direct mapping to AVInputFormat->long_name.

##### Returns

`null` \| `string`

***

### mimeType

#### Get Signature

> **get** **mimeType**(): `null` \| `string`

Defined in: [src/lib/input-format.ts:206](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L206)

MIME type.

MIME type(s) associated with this format.

Direct mapping to AVInputFormat->mime_type.

##### Returns

`null` \| `string`

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/input-format.ts:173](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L173)

Format short name.

Short identifier for the format (e.g., 'mp4', 'mkv').

Direct mapping to AVInputFormat->name.

##### Returns

`null` \| `string`

## Methods

### getNative()

> **getNative**(): `NativeInputFormat`

Defined in: [src/lib/input-format.ts:228](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L228)

**`Internal`**

Get the underlying native InputFormat object.

#### Returns

`NativeInputFormat`

The native InputFormat binding object

#### Implementation of

`NativeWrapper.getNative`

***

### findInputFormat()

> `static` **findInputFormat**(`shortName`): `null` \| `InputFormat`

Defined in: [src/lib/input-format.ts:82](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L82)

Find input format by short name.

Searches for a demuxer by its short name identifier.

Direct mapping to av_find_input_format().

#### Parameters

##### shortName

`string`

Format short name (e.g., 'mp4', 'mkv', 'avi')

#### Returns

`null` \| `InputFormat`

Input format if found, null otherwise

#### Example

```typescript
// Find specific formats
const mp4 = InputFormat.findInputFormat('mp4');
const mkv = InputFormat.findInputFormat('matroska');
const avi = InputFormat.findInputFormat('avi');

// Check if format is available
if (!mp4) {
  console.error('MP4 format not available');
}
```

#### See

[probe](#probe) To auto-detect format

***

### probe()

> `static` **probe**(`buffer`, `filename?`): `null` \| `InputFormat`

Defined in: [src/lib/input-format.ts:120](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L120)

Probe format from buffer data.

Analyzes buffer content to determine the media format.
Optionally uses filename for additional format hints.

Direct mapping to av_probe_input_format2().

#### Parameters

##### buffer

`Buffer`

Buffer containing file header/start

##### filename?

`string`

Optional filename for format hints

#### Returns

`null` \| `InputFormat`

Detected format, or null if not recognized

#### Example

```typescript
import { readFileSync } from 'fs';

// Read first 4KB for probing
const data = readFileSync('video.mp4').subarray(0, 4096);
const format = InputFormat.probe(data, 'video.mp4');

if (format) {
  console.log(`Detected format: ${format.name}`);
} else {
  console.error('Unknown format');
}
```

#### See

 - [probeBuffer](#probebuffer) For IO context probing
 - [findInputFormat](#findinputformat) To get format by name

***

### probeBuffer()

> `static` **probeBuffer**(`ioContext`, `maxProbeSize?`): `Promise`\<`null` \| `InputFormat`\>

Defined in: [src/lib/input-format.ts:158](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/input-format.ts#L158)

Probe format from IO context.

Reads data from an IO context to determine format.
Useful for custom IO scenarios and network streams.

Direct mapping to av_probe_input_buffer2().

#### Parameters

##### ioContext

IO context to read from

###### getNative

Method to get native IO context

##### maxProbeSize?

`number`

Maximum bytes to read for probing

#### Returns

`Promise`\<`null` \| `InputFormat`\>

Detected format, or null if not recognized

#### Example

```typescript
import { IOContext } from 'node-av';

// Create custom IO context
const ioContext = new IOContext();
// ... configure IO context ...

// Probe format
const format = await InputFormat.probeBuffer(ioContext, 32768);
if (format) {
  console.log(`Stream format: ${format.name}`);
}
```

#### See

[probe](#probe) For buffer probing
