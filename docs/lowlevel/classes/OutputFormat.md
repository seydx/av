[node-av](../globals.md) / OutputFormat

# Class: OutputFormat

Defined in: [src/lib/output-format.ts:46](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L46)

Output format descriptor for muxing media files.

Represents a muxer that can write specific media container formats.
Each format handles specific file types (e.g., MP4, MKV, AVI) and knows how to
combine streams and write them to output. Contains default codec suggestions
for audio, video, and subtitles.

Direct mapping to FFmpeg's AVOutputFormat.

## Example

```typescript
import { OutputFormat, FormatContext, FFmpegError } from 'node-av';
import { AV_CODEC_ID_H264, AV_CODEC_ID_AAC } from 'node-av/constants';

// Guess format from filename
const format = OutputFormat.guessFormat(null, 'output.mp4', null);
if (!format) {
  throw new Error('Could not determine output format');
}

console.log(`Format: ${format.name}`);
console.log(`Description: ${format.longName}`);
console.log(`Default video codec: ${format.videoCodec}`);
console.log(`Default audio codec: ${format.audioCodec}`);

// Use specific format
const mkvFormat = OutputFormat.guessFormat('matroska', null, null);

// Use with format context
const formatContext = new FormatContext();
formatContext.outputFormat = format;
const ret = await formatContext.allocOutputContext('output.mp4');
FFmpegError.throwIfError(ret, 'allocOutputContext');
```

## See

 - \[AVOutputFormat\](https://ffmpeg.org/doxygen/trunk/structAVOutputFormat.html)
 - [FormatContext](FormatContext.md) For using formats to write files
 - [InputFormat](InputFormat.md) For demuxing formats

## Implements

- `NativeWrapper`\<`NativeOutputFormat`\>

## Constructors

### Constructor

> **new OutputFormat**(`native`): `OutputFormat`

Defined in: [src/lib/output-format.ts:53](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L53)

**`Internal`**

#### Parameters

##### native

`NativeOutputFormat`

The native output format instance

#### Returns

`OutputFormat`

## Accessors

### audioCodec

#### Get Signature

> **get** **audioCodec**(): `AVCodecID`

Defined in: [src/lib/output-format.ts:148](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L148)

Default audio codec.

Suggested audio codec for this format.

Direct mapping to AVOutputFormat->audio_codec.

##### Returns

`AVCodecID`

***

### extensions

#### Get Signature

> **get** **extensions**(): `null` \| `string`

Defined in: [src/lib/output-format.ts:126](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L126)

File extensions.

Comma-separated list of file extensions for this format.

Direct mapping to AVOutputFormat->extensions.

##### Returns

`null` \| `string`

***

### flags

#### Get Signature

> **get** **flags**(): `AVFormatFlag`

Defined in: [src/lib/output-format.ts:181](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L181)

Format flags.

Combination of AVFMT_* flags indicating format capabilities.

Direct mapping to AVOutputFormat->flags.

##### Returns

`AVFormatFlag`

***

### longName

#### Get Signature

> **get** **longName**(): `null` \| `string`

Defined in: [src/lib/output-format.ts:115](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L115)

Format long name.

Human-readable description of the format.

Direct mapping to AVOutputFormat->long_name.

##### Returns

`null` \| `string`

***

### mimeType

#### Get Signature

> **get** **mimeType**(): `null` \| `string`

Defined in: [src/lib/output-format.ts:137](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L137)

MIME type.

MIME type(s) associated with this format.

Direct mapping to AVOutputFormat->mime_type.

##### Returns

`null` \| `string`

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/output-format.ts:104](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L104)

Format short name.

Short identifier for the format (e.g., 'mp4', 'mkv').

Direct mapping to AVOutputFormat->name.

##### Returns

`null` \| `string`

***

### subtitleCodec

#### Get Signature

> **get** **subtitleCodec**(): `AVCodecID`

Defined in: [src/lib/output-format.ts:170](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L170)

Default subtitle codec.

Suggested subtitle codec for this format.

Direct mapping to AVOutputFormat->subtitle_codec.

##### Returns

`AVCodecID`

***

### videoCodec

#### Get Signature

> **get** **videoCodec**(): `AVCodecID`

Defined in: [src/lib/output-format.ts:159](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L159)

Default video codec.

Suggested video codec for this format.

Direct mapping to AVOutputFormat->video_codec.

##### Returns

`AVCodecID`

## Methods

### getNative()

> **getNative**(): `NativeOutputFormat`

Defined in: [src/lib/output-format.ts:192](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L192)

**`Internal`**

Get the underlying native OutputFormat object.

#### Returns

`NativeOutputFormat`

The native OutputFormat binding object

#### Implementation of

`NativeWrapper.getNative`

***

### guessFormat()

> `static` **guessFormat**(`shortName`, `filename`, `mimeType`): `null` \| `OutputFormat`

Defined in: [src/lib/output-format.ts:89](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/output-format.ts#L89)

Guess output format from name, filename, or MIME type.

Determines the appropriate output format based on provided hints.
At least one parameter should be non-null.

Direct mapping to av_guess_format().

#### Parameters

##### shortName

Format short name (e.g., 'mp4', 'mkv', null to ignore)

`null` | `string`

##### filename

Output filename for extension detection (null to ignore)

`null` | `string`

##### mimeType

MIME type hint (null to ignore)

`null` | `string`

#### Returns

`null` \| `OutputFormat`

Detected format, or null if not determined

#### Example

```typescript
// Guess from filename extension
const format1 = OutputFormat.guessFormat(null, 'video.mp4', null);
// Returns MP4 format

// Use specific format
const format2 = OutputFormat.guessFormat('matroska', null, null);
// Returns MKV format

// Guess from MIME type
const format3 = OutputFormat.guessFormat(null, null, 'video/mp4');
// Returns MP4 format

// Priority: shortName > filename > mimeType
const format4 = OutputFormat.guessFormat('mkv', 'video.mp4', null);
// Returns MKV format (shortName takes precedence)
```
