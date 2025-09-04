[node-av](../globals.md) / FormatContext

# Class: FormatContext

Defined in: [src/lib/format-context.ts:63](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L63)

Container format context for reading/writing multimedia files.

Central structure for demuxing (reading) and muxing (writing) media files.
Manages streams, packets, metadata, and format-specific operations.
Supports both file-based and custom I/O through IOContext.
Essential for all file-based media operations.

Direct mapping to FFmpeg's AVFormatContext.

## Example

```typescript
import { FormatContext, FFmpegError } from 'node-av';
import { AVMEDIA_TYPE_VIDEO } from 'node-av/constants';

// Open input file
const ctx = new FormatContext();
let ret = await ctx.openInput('input.mp4');
FFmpegError.throwIfError(ret, 'openInput');

ret = await ctx.findStreamInfo();
FFmpegError.throwIfError(ret, 'findStreamInfo');

// Find video stream
const videoIndex = ctx.findBestStream(AVMEDIA_TYPE_VIDEO);
if (videoIndex < 0) {
  throw new Error('No video stream found');
}

// Read packets
const packet = new Packet();
packet.alloc();
while ((ret = await ctx.readFrame(packet)) >= 0) {
  if (packet.streamIndex === videoIndex) {
    // Process video packet
  }
  packet.unref();
}

// Cleanup
await ctx.closeInput();
```

## See

 - \[AVFormatContext\](https://ffmpeg.org/doxygen/trunk/structAVFormatContext.html)
 - [InputFormat](InputFormat.md) For supported input formats
 - [OutputFormat](OutputFormat.md) For supported output formats
 - [Stream](Stream.md) For stream management

## Extends

- `OptionMember`\<`NativeFormatContext`\>

## Implements

- `AsyncDisposable`
- `NativeWrapper`\<`NativeFormatContext`\>

## Constructors

### Constructor

> **new FormatContext**(): `FormatContext`

Defined in: [src/lib/format-context.ts:66](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L66)

#### Returns

`FormatContext`

#### Overrides

`OptionMember<NativeFormatContext>.constructor`

## Properties

### native

> `protected` **native**: `NativeFormatContext`

Defined in: [src/lib/option.ts:733](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L733)

#### Inherited from

`OptionMember.native`

## Accessors

### bitRate

#### Get Signature

> **get** **bitRate**(): `bigint`

Defined in: [src/lib/format-context.ts:118](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L118)

Total stream bitrate.

Bitrate in bits per second.
0 if unknown.

Direct mapping to AVFormatContext->bit_rate.

##### Returns

`bigint`

***

### duration

#### Get Signature

> **get** **duration**(): `bigint`

Defined in: [src/lib/format-context.ts:106](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L106)

Duration of the stream.

Total stream duration in microseconds.
AV_NOPTS_VALUE if unknown.

Direct mapping to AVFormatContext->duration.

##### Returns

`bigint`

***

### flags

#### Get Signature

> **get** **flags**(): `AVFormatFlag`

Defined in: [src/lib/format-context.ts:130](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L130)

Format-specific flags.

Combination of AVFMT_FLAG_* values controlling
format behavior (e.g., AVFMT_FLAG_GENPTS).

Direct mapping to AVFormatContext->flags.

##### Returns

`AVFormatFlag`

#### Set Signature

> **set** **flags**(`value`): `void`

Defined in: [src/lib/format-context.ts:134](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L134)

##### Parameters

###### value

`AVFormatFlag`

##### Returns

`void`

***

### iformat

#### Get Signature

> **get** **iformat**(): `null` \| [`InputFormat`](InputFormat.md)

Defined in: [src/lib/format-context.ts:196](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L196)

Input format descriptor.

Format used for demuxing. Null for output contexts.

Direct mapping to AVFormatContext->iformat.

##### Returns

`null` \| [`InputFormat`](InputFormat.md)

***

### maxAnalyzeDuration

#### Get Signature

> **get** **maxAnalyzeDuration**(): `bigint`

Defined in: [src/lib/format-context.ts:162](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L162)

Maximum duration to analyze streams.

Time in microseconds to spend analyzing streams.
Larger values improve stream detection accuracy.

Direct mapping to AVFormatContext->max_analyze_duration.

##### Returns

`bigint`

#### Set Signature

> **set** **maxAnalyzeDuration**(`value`): `void`

Defined in: [src/lib/format-context.ts:166](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L166)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### maxStreams

#### Get Signature

> **get** **maxStreams**(): `number`

Defined in: [src/lib/format-context.ts:286](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L286)

Maximum number of streams.

Limit on stream count for security/resource reasons.

Direct mapping to AVFormatContext->max_streams.

##### Returns

`number`

#### Set Signature

> **set** **maxStreams**(`value`): `void`

Defined in: [src/lib/format-context.ts:290](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L290)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### metadata

#### Get Signature

> **get** **metadata**(): `null` \| [`Dictionary`](Dictionary.md)

Defined in: [src/lib/format-context.ts:177](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L177)

Container metadata.

Key-value pairs of metadata (title, author, etc.).

Direct mapping to AVFormatContext->metadata.

##### Returns

`null` \| [`Dictionary`](Dictionary.md)

#### Set Signature

> **set** **metadata**(`value`): `void`

Defined in: [src/lib/format-context.ts:185](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L185)

##### Parameters

###### value

`null` | [`Dictionary`](Dictionary.md)

##### Returns

`void`

***

### nbPrograms

#### Get Signature

> **get** **nbPrograms**(): `number`

Defined in: [src/lib/format-context.ts:301](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L301)

Number of programs.

For containers with multiple programs (e.g., MPEG-TS).

Direct mapping to AVFormatContext->nb_programs.

##### Returns

`number`

***

### nbStreams

#### Get Signature

> **get** **nbStreams**(): `number`

Defined in: [src/lib/format-context.ts:244](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L244)

Number of streams in the container.

Direct mapping to AVFormatContext->nb_streams.

##### Returns

`number`

***

### oformat

#### Get Signature

> **get** **oformat**(): `null` \| [`OutputFormat`](OutputFormat.md)

Defined in: [src/lib/format-context.ts:211](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L211)

Output format descriptor.

Format used for muxing. Null for input contexts.

Direct mapping to AVFormatContext->oformat.

##### Returns

`null` \| [`OutputFormat`](OutputFormat.md)

#### Set Signature

> **set** **oformat**(`value`): `void`

Defined in: [src/lib/format-context.ts:219](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L219)

##### Parameters

###### value

`null` | [`OutputFormat`](OutputFormat.md)

##### Returns

`void`

***

### pb

#### Get Signature

> **get** **pb**(): `null` \| [`IOContext`](IOContext.md)

Defined in: [src/lib/format-context.ts:230](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L230)

Custom I/O context.

For custom I/O operations instead of file I/O.

Direct mapping to AVFormatContext->pb.

##### Returns

`null` \| [`IOContext`](IOContext.md)

#### Set Signature

> **set** **pb**(`value`): `void`

Defined in: [src/lib/format-context.ts:234](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L234)

##### Parameters

###### value

`null` | [`IOContext`](IOContext.md)

##### Returns

`void`

***

### pbBytes

#### Get Signature

> **get** **pbBytes**(): `bigint`

Defined in: [src/lib/format-context.ts:310](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L310)

Number of bytes read/written through I/O context.

Direct mapping to avio_tell(AVFormatContext->pb).

##### Returns

`bigint`

***

### probeScore

#### Get Signature

> **get** **probeScore**(): `number`

Defined in: [src/lib/format-context.ts:322](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L322)

Format probe score.

Confidence score from format detection (0-100).
Higher values indicate more confident detection.

Direct mapping to AVFormatContext->probe_score.

##### Returns

`number`

***

### probesize

#### Get Signature

> **get** **probesize**(): `bigint`

Defined in: [src/lib/format-context.ts:146](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L146)

Maximum bytes to probe for format detection.

Larger values improve format detection accuracy
but increase startup time.

Direct mapping to AVFormatContext->probesize.

##### Returns

`bigint`

#### Set Signature

> **set** **probesize**(`value`): `void`

Defined in: [src/lib/format-context.ts:150](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L150)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### startTime

#### Get Signature

> **get** **startTime**(): `bigint`

Defined in: [src/lib/format-context.ts:94](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L94)

Start time of the stream.

Position of the first frame in microseconds.
AV_NOPTS_VALUE if unknown.

Direct mapping to AVFormatContext->start_time.

##### Returns

`bigint`

***

### streams

#### Get Signature

> **get** **streams**(): `null` \| [`Stream`](Stream.md)[]

Defined in: [src/lib/format-context.ts:255](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L255)

Array of streams in the container.

All audio, video, subtitle, and data streams.

Direct mapping to AVFormatContext->streams.

##### Returns

`null` \| [`Stream`](Stream.md)[]

***

### strictStdCompliance

#### Get Signature

> **get** **strictStdCompliance**(): `number`

Defined in: [src/lib/format-context.ts:271](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L271)

Strictness level for standards compliance.

FF_COMPLIANCE_* value controlling how strictly
to follow specifications.

Direct mapping to AVFormatContext->strict_std_compliance.

##### Returns

`number`

#### Set Signature

> **set** **strictStdCompliance**(`value`): `void`

Defined in: [src/lib/format-context.ts:275](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L275)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### url

#### Get Signature

> **get** **url**(): `null` \| `string`

Defined in: [src/lib/format-context.ts:78](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L78)

URL or filename of the media.

For input: the opened file path.
For output: the target file path.

Direct mapping to AVFormatContext->url.

##### Returns

`null` \| `string`

#### Set Signature

> **set** **url**(`value`): `void`

Defined in: [src/lib/format-context.ts:82](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L82)

##### Parameters

###### value

`null` | `string`

##### Returns

`void`

## Methods

### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

Defined in: [src/lib/format-context.ts:898](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L898)

Dispose of the format context.

Implements the AsyncDisposable interface for automatic cleanup.
Closes input/output and frees resources.

#### Returns

`Promise`\<`void`\>

Promise that resolves when disposed

#### Example

```typescript
{
  await using ctx = new FormatContext();
  await ctx.openInput('input.mp4');
  // Use context...
} // Automatically closed and freed
```

#### Implementation of

`AsyncDisposable.[asyncDispose]`

***

### allocContext()

> **allocContext**(): `void`

Defined in: [src/lib/format-context.ts:341](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L341)

Allocate a format context.

Allocates the context structure. Usually not needed
as openInput/allocOutputContext2 handle this.

Direct mapping to avformat_alloc_context().

#### Returns

`void`

#### Example

```typescript
const ctx = new FormatContext();
ctx.allocContext();
// Context is now allocated
```

***

### allocOutputContext2()

> **allocOutputContext2**(`oformat`, `formatName`, `filename`): `number`

Defined in: [src/lib/format-context.ts:372](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L372)

Allocate an output format context.

Allocates and configures context for writing.
Format is determined by parameters in priority order.

Direct mapping to avformat_alloc_output_context2().

#### Parameters

##### oformat

Specific output format to use

`null` | [`OutputFormat`](OutputFormat.md)

##### formatName

Format name (e.g., 'mp4', 'mkv')

`null` | `string`

##### filename

Filename to guess format from extension

`null` | `string`

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ctx = new FormatContext();
const ret = ctx.allocOutputContext2(null, 'mp4', 'output.mp4');
FFmpegError.throwIfError(ret, 'allocOutputContext2');
```

#### See

 - [openOutput](#openoutput) To open output file
 - [writeHeader](#writeheader) To write file header

***

### closeInput()

> **closeInput**(): `Promise`\<`void`\>

Defined in: [src/lib/format-context.ts:416](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L416)

Close an input format context.

Closes input file and releases resources.

Direct mapping to avformat_close_input().

#### Returns

`Promise`\<`void`\>

Promise that resolves when closed

#### Example

```typescript
await ctx.closeInput();
// Input closed and context freed
```

#### See

[openInput](#openinput) To open input

***

### closeOutput()

> **closeOutput**(): `Promise`\<`void`\>

Defined in: [src/lib/format-context.ts:465](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L465)

Close output file.

Closes the output file and releases I/O resources.

Direct mapping to avio_closep().

#### Returns

`Promise`\<`void`\>

Promise that resolves when closed

#### Example

```typescript
await ctx.closeOutput();
// Output file closed
```

#### See

[openOutput](#openoutput) To open output

***

### dumpFormat()

> **dumpFormat**(`index`, `url`, `isOutput`): `void`

Defined in: [src/lib/format-context.ts:783](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L783)

Print format information.

Dumps human-readable format info to stderr.
Useful for debugging.

Direct mapping to av_dump_format().

#### Parameters

##### index

`number`

Stream index to highlight (-1 for none)

##### url

`string`

URL to display

##### isOutput

`boolean`

True for output format, false for input

#### Returns

`void`

#### Example

```typescript
// Dump input format info
ctx.dumpFormat(0, 'input.mp4', false);

// Dump output format info
ctx.dumpFormat(0, 'output.mp4', true);
```

***

### findBestStream()

#### Call Signature

> **findBestStream**(`type`, `wantedStreamNb?`, `relatedStream?`): `number`

Defined in: [src/lib/format-context.ts:814](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L814)

Find the best stream of a given type.

Selects the most suitable stream (e.g., default audio/video).

Direct mapping to av_find_best_stream().

##### Parameters

###### type

`AVMediaType`

Media type to find (AVMEDIA_TYPE_*)

###### wantedStreamNb?

`number`

Preferred stream index (-1 for auto)

###### relatedStream?

`number`

Related stream for audio/video sync (-1 for none)

##### Returns

`number`

Stream index, or negative AVERROR if not found

##### Example

```typescript
import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';

const videoIndex = ctx.findBestStream(AVMEDIA_TYPE_VIDEO);
if (videoIndex >= 0) {
  console.log(`Best video stream: ${videoIndex}`);
}

const audioIndex = ctx.findBestStream(AVMEDIA_TYPE_AUDIO);
if (audioIndex >= 0) {
  console.log(`Best audio stream: ${audioIndex}`);
}
```

#### Call Signature

> **findBestStream**(`type`, `wantedStreamNb`, `relatedStream`, `wantDecoder`, `flags?`): `object`

Defined in: [src/lib/format-context.ts:825](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L825)

Find the best stream and its decoder.

##### Parameters

###### type

`AVMediaType`

Media type to find

###### wantedStreamNb

`number`

Preferred stream index

###### relatedStream

`number`

Related stream index

###### wantDecoder

`true`

True to also find decoder

###### flags?

`number`

Reserved flags

##### Returns

`object`

Object with stream index and decoder

###### decoder

> **decoder**: `null` \| [`Codec`](Codec.md)

###### streamIndex

> **streamIndex**: `number`

***

### findStreamInfo()

> **findStreamInfo**(`options`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:524](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L524)

Analyze streams to get stream info.

Reads packet headers to fill in stream information.
Should be called after openInput for accurate stream data.

Direct mapping to avformat_find_stream_info().

#### Parameters

##### options

Per-stream options array

`null` | [`Dictionary`](Dictionary.md)[]

#### Returns

`Promise`\<`number`\>

>=0 on success, negative AVERROR on error:
  - AVERROR_EOF: End of file reached
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = await ctx.findStreamInfo();
FFmpegError.throwIfError(ret, 'findStreamInfo');
console.log(`Found ${ctx.nbStreams} streams`);
```

#### See

[openInput](#openinput) Must be called first

***

### flush()

> **flush**(): `void`

Defined in: [src/lib/format-context.ts:758](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L758)

Flush buffered data.

Flushes any buffered packets in muxers.

Direct mapping to avio_flush().

#### Returns

`void`

#### Example

```typescript
ctx.flush();
// Buffered data written to output
```

***

### freeContext()

> **freeContext**(): `void`

Defined in: [src/lib/format-context.ts:395](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L395)

Free the format context.

Releases all resources. The context becomes invalid.

Direct mapping to avformat_free_context().

#### Returns

`void`

#### Example

```typescript
ctx.freeContext();
// Context is now invalid
```

#### See

Symbol.asyncDispose For automatic cleanup

***

### getNative()

> **getNative**(): `NativeFormatContext`

Defined in: [src/lib/format-context.ts:877](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L877)

**`Internal`**

Get the underlying native FormatContext object.

#### Returns

`NativeFormatContext`

The native FormatContext binding object

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

### interleavedWriteFrame()

> **interleavedWriteFrame**(`pkt`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:715](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L715)

Write packet with automatic interleaving.

Writes packet with proper interleaving for muxing.
Preferred method for writing packets.

Direct mapping to av_interleaved_write_frame().

#### Parameters

##### pkt

Packet to write (null to flush)

`null` | [`Packet`](Packet.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid packet
  - AVERROR_EIO: I/O error

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Write with proper interleaving
const ret = await ctx.interleavedWriteFrame(packet);
FFmpegError.throwIfError(ret, 'interleavedWriteFrame');

// Flush buffered packets
await ctx.interleavedWriteFrame(null);
```

#### See

[writeFrame](#writeframe) For direct writing

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

### newStream()

> **newStream**(`c`): [`Stream`](Stream.md)

Defined in: [src/lib/format-context.ts:865](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L865)

Add a new stream to output context.

Creates a new stream for writing.

Direct mapping to avformat_new_stream().

#### Parameters

##### c

Codec for the stream (optional)

`null` | [`Codec`](Codec.md)

#### Returns

[`Stream`](Stream.md)

New stream instance

#### Example

```typescript
import { Codec } from 'node-av';
import { AV_CODEC_ID_H264 } from 'node-av/constants';

const codec = Codec.findEncoder(AV_CODEC_ID_H264);
const stream = ctx.newStream(codec);
stream.id = ctx.nbStreams - 1;
```

#### See

[Stream](Stream.md) For stream configuration

***

### openInput()

> **openInput**(`url`, `fmt`, `options`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:496](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L496)

Open input file for reading.

Opens and probes the input file, detecting format automatically
unless specified.

Direct mapping to avformat_open_input().

#### Parameters

##### url

`string`

URL or file path to open

##### fmt

Force specific input format (null for auto-detect)

`null` | [`InputFormat`](InputFormat.md)

##### options

Format-specific options

`null` | [`Dictionary`](Dictionary.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_ENOENT: File not found
  - AVERROR_INVALIDDATA: Invalid file format
  - AVERROR_EIO: I/O error

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = await ctx.openInput('input.mp4');
FFmpegError.throwIfError(ret, 'openInput');
```

#### See

 - [findStreamInfo](#findstreaminfo) To analyze streams after opening
 - [closeInput](#closeinput) To close input

***

### openOutput()

> **openOutput**(): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:444](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L444)

Open output file for writing.

Opens the output file specified in url.
Must call allocOutputContext2 first.

Direct mapping to avio_open2().

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_ENOENT: File not found
  - AVERROR_EACCES: Permission denied
  - AVERROR_EIO: I/O error

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = await ctx.openOutput();
FFmpegError.throwIfError(ret, 'openOutput');
```

#### See

 - [allocOutputContext2](#allocoutputcontext2) Must be called first
 - [closeOutput](#closeoutput) To close output

***

### readFrame()

> **readFrame**(`pkt`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:563](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L563)

Read next packet from the input.

Reads and returns the next packet in the stream.
Packet must be unreferenced after use.

Direct mapping to av_read_frame().

#### Parameters

##### pkt

[`Packet`](Packet.md)

Packet to read into

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EOF: End of file
  - AVERROR_EAGAIN: Temporarily unavailable

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EOF } from 'node-av';

const packet = new Packet();
packet.alloc();

let ret;
while ((ret = await ctx.readFrame(packet)) >= 0) {
  // Process packet
  console.log(`Stream ${packet.streamIndex}, PTS: ${packet.pts}`);
  packet.unref();
}

if (ret !== AVERROR_EOF) {
  FFmpegError.throwIfError(ret, 'readFrame');
}
```

#### See

[seekFrame](#seekframe) To seek before reading

***

### seekFile()

> **seekFile**(`streamIndex`, `minTs`, `ts`, `maxTs`, `flags`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:628](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L628)

Seek to timestamp with bounds.

More precise seeking with min/max timestamp bounds.

Direct mapping to avformat_seek_file().

#### Parameters

##### streamIndex

`number`

Stream to seek in (-1 for default)

##### minTs

`bigint`

Minimum acceptable timestamp

##### ts

`bigint`

Target timestamp

##### maxTs

`bigint`

Maximum acceptable timestamp

##### flags

`AVSeekFlag` = `AVFLAG_NONE`

Seek flags

#### Returns

`Promise`\<`number`\>

>=0 on success, negative AVERROR on error

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Seek to 10s with 0.5s tolerance
const target = 10000n;
const ret = await ctx.seekFile(
  -1,
  target - 500n,
  target,
  target + 500n
);
FFmpegError.throwIfError(ret, 'seekFile');
```

#### See

[seekFrame](#seekframe) For simpler seeking

***

### seekFrame()

> **seekFrame**(`streamIndex`, `timestamp`, `flags`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:593](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L593)

Seek to timestamp in stream.

Seeks to the keyframe at or before the given timestamp.

Direct mapping to av_seek_frame().

#### Parameters

##### streamIndex

`number`

Stream to seek in (-1 for default)

##### timestamp

`bigint`

Target timestamp in stream time base

##### flags

`AVSeekFlag` = `AVFLAG_NONE`

Seek flags (AVSEEK_FLAG_*)

#### Returns

`Promise`\<`number`\>

>=0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_EOF: Seek beyond file

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVSEEK_FLAG_BACKWARD } from 'node-av/constants';

// Seek to 10 seconds (assuming 1/1000 time base)
const ret = await ctx.seekFrame(videoStreamIndex, 10000n, AVSEEK_FLAG_BACKWARD);
FFmpegError.throwIfError(ret, 'seekFrame');
```

#### See

[seekFile](#seekfile) For more precise seeking

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

***

### writeFrame()

> **writeFrame**(`pkt`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:684](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L684)

Write packet to output.

Writes a packet directly without interleaving.
Caller must handle correct interleaving.

Direct mapping to av_write_frame().

#### Parameters

##### pkt

Packet to write (null to flush)

`null` | [`Packet`](Packet.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid packet
  - AVERROR_EIO: I/O error

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = await ctx.writeFrame(packet);
FFmpegError.throwIfError(ret, 'writeFrame');
```

#### See

[interleavedWriteFrame](#interleavedwriteframe) For automatic interleaving

***

### writeHeader()

> **writeHeader**(`options`): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:657](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L657)

Write file header.

Writes the file header and initializes output.
Must be called before writing packets.

Direct mapping to avformat_write_header().

#### Parameters

##### options

Muxer-specific options

`null` | [`Dictionary`](Dictionary.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_EIO: I/O error

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = await ctx.writeHeader();
FFmpegError.throwIfError(ret, 'writeHeader');
// Now ready to write packets
```

#### See

 - [writeTrailer](#writetrailer) To finalize file
 - [writeFrame](#writeframe) To write packets

***

### writeTrailer()

> **writeTrailer**(): `Promise`\<`number`\>

Defined in: [src/lib/format-context.ts:741](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/format-context.ts#L741)

Write file trailer.

Finalizes the output file, writing index and metadata.
Must be called to properly close output files.

Direct mapping to av_write_trailer().

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EIO: I/O error

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = await ctx.writeTrailer();
FFmpegError.throwIfError(ret, 'writeTrailer');
// File is now finalized
```

#### See

[writeHeader](#writeheader) Must be called first
