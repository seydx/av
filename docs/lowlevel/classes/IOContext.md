[node-av](../globals.md) / IOContext

# Class: IOContext

Defined in: [src/lib/io-context.ts:74](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L74)

I/O context for custom input/output operations.

Provides an abstraction layer for all I/O operations in FFmpeg.
Enables reading from and writing to various sources including files,
network streams, memory buffers, and custom callbacks. Essential for
implementing custom protocols or handling non-standard I/O scenarios.

Direct mapping to FFmpeg's AVIOContext.

## Example

```typescript
import { IOContext, FFmpegError } from 'node-av';
import { AVIO_FLAG_READ, AVIO_FLAG_WRITE, AVSEEK_SET } from 'node-av/constants';

// Open file for reading
const io = new IOContext();
const ret = await io.open2('input.mp4', AVIO_FLAG_READ);
FFmpegError.throwIfError(ret, 'open2');

// Read data
const data = await io.read(4096);
if (data instanceof Buffer) {
  console.log(`Read ${data.length} bytes`);
}

// Seek to position
const pos = await io.seek(1024n, AVSEEK_SET);
console.log(`Seeked to position ${pos}`);

// Get file size
const fileSize = await io.size();
console.log(`File size: ${fileSize}`);

// Close when done
await io.closep();

// Custom I/O with callbacks
const customIO = new IOContext();
let position = 0n;
const buffer = Buffer.from('Hello World');

customIO.allocContextWithCallbacks(
  4096,  // Buffer size
  0,     // Read mode
  (size) => {
    // Read callback
    const end = Number(position) + size;
    const chunk = buffer.subarray(Number(position), end);
    position = BigInt(end);
    return chunk;
  },
  null,  // No write callback for read mode
  (offset, whence) => {
    // Seek callback
    if (whence === AVSEEK_SET) position = offset;
    else if (whence === AVSEEK_CUR) position += offset;
    else if (whence === AVSEEK_END) position = BigInt(buffer.length) + offset;
    return position;
  }
);
```

## See

 - \[AVIOContext\](https://ffmpeg.org/doxygen/trunk/structAVIOContext.html)
 - [FormatContext](FormatContext.md) For using with demuxing/muxing

## Extends

- `OptionMember`\<`NativeIOContext`\>

## Implements

- `AsyncDisposable`
- `NativeWrapper`\<`NativeIOContext`\>

## Constructors

### Constructor

> **new IOContext**(): `IOContext`

Defined in: [src/lib/io-context.ts:75](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L75)

#### Returns

`IOContext`

#### Overrides

`OptionMember<NativeIOContext>.constructor`

## Properties

### native

> `protected` **native**: `NativeIOContext`

Defined in: [src/lib/option.ts:733](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L733)

#### Inherited from

`OptionMember.native`

## Accessors

### bufferSize

#### Get Signature

> **get** **bufferSize**(): `number`

Defined in: [src/lib/io-context.ts:179](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L179)

Internal buffer size.

Size of the internal buffer used for I/O operations.

Direct mapping to AVIOContext->buffer_size.

##### Returns

`number`

***

### direct

#### Get Signature

> **get** **direct**(): `number`

Defined in: [src/lib/io-context.ts:153](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L153)

Direct mode flag.

If set, the I/O context will attempt to avoid buffering.

Direct mapping to AVIOContext->direct.

##### Returns

`number`

#### Set Signature

> **set** **direct**(`value`): `void`

Defined in: [src/lib/io-context.ts:157](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L157)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### eof

#### Get Signature

> **get** **eof**(): `boolean`

Defined in: [src/lib/io-context.ts:103](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L103)

End of file indicator.

True if end of file has been reached during reading.

Direct mapping to AVIOContext->eof_reached.

##### Returns

`boolean`

***

### error

#### Get Signature

> **get** **error**(): `number`

Defined in: [src/lib/io-context.ts:114](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L114)

Error code.

Contains the last error that occurred, or 0 if no error.

Direct mapping to AVIOContext->error.

##### Returns

`number`

***

### maxPacketSize

#### Get Signature

> **get** **maxPacketSize**(): `number`

Defined in: [src/lib/io-context.ts:138](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L138)

Maximum packet size.

Used to limit packet sizes in network protocols.
0 means no limit.

Direct mapping to AVIOContext->max_packet_size.

##### Returns

`number`

#### Set Signature

> **set** **maxPacketSize**(`value`): `void`

Defined in: [src/lib/io-context.ts:142](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L142)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### pos

#### Get Signature

> **get** **pos**(): `bigint`

Defined in: [src/lib/io-context.ts:168](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L168)

Current position.

Current byte position in the stream.

Direct mapping to AVIOContext->pos.

##### Returns

`bigint`

***

### seekable

#### Get Signature

> **get** **seekable**(): `number`

Defined in: [src/lib/io-context.ts:126](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L126)

Seekability indicator.

Non-zero if the underlying resource supports seeking.
Some protocols like pipes or network streams may not be seekable.

Direct mapping to AVIOContext->seekable.

##### Returns

`number`

***

### writeFlag

#### Get Signature

> **get** **writeFlag**(): `boolean`

Defined in: [src/lib/io-context.ts:190](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L190)

Write flag.

True if opened for writing, false for reading.

Direct mapping to AVIOContext->write_flag.

##### Returns

`boolean`

## Methods

### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

Defined in: [src/lib/io-context.ts:549](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L549)

Dispose of the I/O context asynchronously.

Implements the AsyncDisposable interface for automatic cleanup.
Closes the context and releases resources.

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
{
  await using io = new IOContext();
  await io.open2('input.mp4');
  // Use io...
} // Automatically closed when leaving scope
```

#### Implementation of

`AsyncDisposable.[asyncDispose]`

***

### allocContext()

> **allocContext**(`bufferSize`, `writeFlag`): `void`

Defined in: [src/lib/io-context.ts:213](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L213)

Allocate I/O context with buffer.

Allocates a basic I/O context with an internal buffer.
For custom I/O, use allocContextWithCallbacks instead.

Direct mapping to avio_alloc_context() without callbacks.

#### Parameters

##### bufferSize

`number`

Size of internal buffer

##### writeFlag

`number`

1 for write, 0 for read

#### Returns

`void`

#### Example

```typescript
const io = new IOContext();
io.allocContext(4096, 0); // 4KB buffer for reading
```

#### See

[allocContextWithCallbacks](#alloccontextwithcallbacks) For custom I/O

***

### allocContextWithCallbacks()

> **allocContextWithCallbacks**(`bufferSize`, `writeFlag`, `readCallback?`, `writeCallback?`, `seekCallback?`): `void`

Defined in: [src/lib/io-context.ts:262](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L262)

Allocate I/O context with custom callbacks.

Creates an I/O context with custom read, write, and seek callbacks.
Enables implementing custom protocols or data sources.

Direct mapping to avio_alloc_context() with callbacks.

#### Parameters

##### bufferSize

`number`

Size of internal buffer

##### writeFlag

1 for write mode, 0 for read mode

`0` | `1`

##### readCallback?

Function to read data (null for write-only)

`null` | (`size`) => `null` \| `number` \| `Buffer`\<`ArrayBufferLike`\>

##### writeCallback?

Function to write data (null for read-only)

`null` | (`buffer`) => `number` \| `void`

##### seekCallback?

Function to seek in stream (optional)

`null` | (`offset`, `whence`) => `number` \| `bigint`

#### Returns

`void`

#### Example

```typescript
import { AVSEEK_SET, AVSEEK_CUR, AVSEEK_END, AVSEEK_SIZE } from 'node-av/constants';

const data = Buffer.from('Custom data source');
let position = 0;

io.allocContextWithCallbacks(
  4096,
  0, // Read mode
  (size) => {
    // Read callback
    if (position >= data.length) return -541; // EOF
    const chunk = data.subarray(position, position + size);
    position += chunk.length;
    return chunk;
  },
  null,
  (offset, whence) => {
    // Seek callback
    if (whence === AVSEEK_SIZE) return BigInt(data.length);
    if (whence === AVSEEK_SET) position = Number(offset);
    else if (whence === AVSEEK_CUR) position += Number(offset);
    else if (whence === AVSEEK_END) position = data.length + Number(offset);
    return BigInt(position);
  }
);
```

#### See

[allocContext](#alloccontext) For simple allocation

***

### closep()

> **closep**(): `Promise`\<`number`\>

Defined in: [src/lib/io-context.ts:345](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L345)

Close I/O context.

Closes the I/O context and releases associated resources.
Flushes any buffered data before closing.

Direct mapping to avio_closep().

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error

#### Example

```typescript
const ret = await io.closep();
if (ret < 0) {
  console.error('Error closing I/O context');
}
```

#### See

[open2](#open2) To open resources

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [src/lib/io-context.ts:474](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L474)

Flush buffered data.

Forces any buffered data to be written to the underlying resource.

Direct mapping to avio_flush().

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
await io.write(data);
await io.flush(); // Ensure data is written
```

#### See

[write](#write) For writing data

***

### freeContext()

> **freeContext**(): `void`

Defined in: [src/lib/io-context.ts:286](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L286)

Free I/O context.

Releases the I/O context and its resources.
The context becomes invalid after calling this.

Direct mapping to avio_context_free().

#### Returns

`void`

#### Example

```typescript
io.freeContext();
// Context is now invalid
```

***

### getNative()

> **getNative**(): `NativeIOContext`

Defined in: [src/lib/io-context.ts:530](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L530)

**`Internal`**

Get the underlying native IOContext object.

#### Returns

`NativeIOContext`

The native IOContext binding object

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

> **open2**(`url`, `flags`): `Promise`\<`number`\>

Defined in: [src/lib/io-context.ts:321](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L321)

Open resource for I/O.

Opens a URL or file for reading or writing.
Automatically selects the appropriate protocol handler.

Direct mapping to avio_open2().

#### Parameters

##### url

`string`

URL or file path to open

##### flags

`AVIOFlag` = `AVIO_FLAG_READ`

Open flags (AVIO_FLAG_READ, AVIO_FLAG_WRITE, etc.)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_ENOENT: File not found
  - AVERROR_EACCES: Permission denied
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVIO_FLAG_READ, AVIO_FLAG_WRITE } from 'node-av/constants';

// Open for reading
const ret = await io.open2('input.mp4', AVIO_FLAG_READ);
FFmpegError.throwIfError(ret, 'open2');

// Open for writing
const ret2 = await io.open2('output.mp4', AVIO_FLAG_WRITE);
FFmpegError.throwIfError(ret2, 'open2');
```

#### See

[closep](#closep) To close after use

***

### read()

> **read**(`size`): `Promise`\<`number` \| `Buffer`\<`ArrayBufferLike`\>\>

Defined in: [src/lib/io-context.ts:373](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L373)

Read data from I/O context.

Reads up to the specified number of bytes from the stream.

Direct mapping to avio_read().

#### Parameters

##### size

`number`

Maximum number of bytes to read

#### Returns

`Promise`\<`number` \| `Buffer`\<`ArrayBufferLike`\>\>

Buffer with data, or error code if negative:
  - AVERROR_EOF: End of file reached
  - AVERROR_EIO: I/O error

#### Example

```typescript
const data = await io.read(4096);
if (data instanceof Buffer) {
  console.log(`Read ${data.length} bytes`);
} else {
  console.error(`Read error: ${data}`);
}
```

#### See

[write](#write) For writing data

***

### seek()

> **seek**(`offset`, `whence`): `Promise`\<`bigint`\>

Defined in: [src/lib/io-context.ts:430](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L430)

Seek to position in stream.

Changes the current position in the stream.
Not all streams support seeking.

Direct mapping to avio_seek().

#### Parameters

##### offset

`bigint`

Byte offset to seek to

##### whence

`AVSeekWhence`

Seek origin (AVSEEK_SET, AVSEEK_CUR, AVSEEK_END)

#### Returns

`Promise`\<`bigint`\>

New position, or negative AVERROR on error:
  - AVERROR_EINVAL: Invalid arguments
  - AVERROR_ENOSYS: Seeking not supported

#### Example

```typescript
import { AVSEEK_SET, AVSEEK_CUR, AVSEEK_END } from 'node-av/constants';

// Seek to absolute position
const pos1 = await io.seek(1024n, AVSEEK_SET);

// Seek relative to current position
const pos2 = await io.seek(512n, AVSEEK_CUR);

// Seek relative to end
const pos3 = await io.seek(-1024n, AVSEEK_END);
```

#### See

 - [tell](#tell) To get current position
 - [skip](#skip) For relative seeking

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

### size()

> **size**(): `Promise`\<`bigint`\>

Defined in: [src/lib/io-context.ts:455](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L455)

Get stream size.

Returns the total size of the stream in bytes.
Not all streams have a known size.

Direct mapping to avio_size().

#### Returns

`Promise`\<`bigint`\>

Size in bytes, or negative AVERROR if unknown:
  - AVERROR_ENOSYS: Size not available

#### Example

```typescript
const size = await io.size();
if (size >= 0n) {
  console.log(`Stream size: ${size} bytes`);
} else {
  console.log('Stream size unknown');
}
```

***

### skip()

> **skip**(`offset`): `Promise`\<`bigint`\>

Defined in: [src/lib/io-context.ts:498](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L498)

Skip bytes in stream.

Advances the position by the specified offset.
More efficient than reading and discarding data.

Direct mapping to avio_skip().

#### Parameters

##### offset

`bigint`

Number of bytes to skip

#### Returns

`Promise`\<`bigint`\>

New position after skipping

#### Example

```typescript
// Skip 1024 bytes forward
const newPos = await io.skip(1024n);
console.log(`New position: ${newPos}`);
```

#### See

[seek](#seek) For absolute positioning

***

### tell()

> **tell**(): `bigint`

Defined in: [src/lib/io-context.ts:519](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L519)

Get current position.

Returns the current byte position in the stream.

Direct mapping to avio_tell().

#### Returns

`bigint`

Current position in bytes

#### Example

```typescript
const position = io.tell();
console.log(`Current position: ${position}`);
```

#### See

[seek](#seek) To change position

***

### write()

> **write**(`buffer`): `Promise`\<`void`\>

Defined in: [src/lib/io-context.ts:395](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L395)

Write data to I/O context.

Writes buffer data to the stream.

Direct mapping to avio_write().

#### Parameters

##### buffer

`Buffer`

Data to write

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
const data = Buffer.from('Hello World');
await io.write(data);
```

#### See

 - [read](#read) For reading data
 - [flush](#flush) To flush buffers

***

### fromNative()

> `static` **fromNative**(`native`): `IOContext`

Defined in: [src/lib/io-context.ts:90](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/io-context.ts#L90)

**`Internal`**

Find input format by short name.

Creates an IOContext instance from a native binding object.
Used internally for wrapping native I/O contexts.

#### Parameters

##### native

`NativeIOContext`

Native IOContext binding object

#### Returns

`IOContext`

Wrapped IOContext instance
