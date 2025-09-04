[node-av](../globals.md) / CodecParser

# Class: CodecParser

Defined in: [src/lib/codec-parser.ts:53](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parser.ts#L53)

Parser for extracting codec frames from raw bitstream data.

Analyzes and splits raw bitstream data into individual codec frames.
Essential for processing elementary streams, extracting NAL units,
and handling frame boundaries in raw codec data. Commonly used for
parsing H.264/H.265 streams, AAC ADTS streams, and other raw formats.

Direct mapping to FFmpeg's AVCodecParserContext.

## Example

```typescript
import { CodecParser, CodecContext, Packet, FFmpegError } from 'node-av';
import { AV_CODEC_ID_H264 } from 'node-av/constants';

// Create and initialize parser
const parser = new CodecParser();
parser.init(AV_CODEC_ID_H264);

// Parse raw data into packets
const packet = new Packet();
packet.alloc();

const rawData = Buffer.from([...]); // Raw H.264 stream
const ret = parser.parse2(
  codecContext,
  packet,
  rawData,
  0n,  // pts
  0n,  // dts
  0    // position
);

if (ret > 0) {
  // Got complete packet, ret is consumed bytes
  console.log(`Parsed ${ret} bytes into packet`);
}

// Cleanup
parser.close();
```

## See

 - \[AVCodecParserContext\](https://ffmpeg.org/doxygen/trunk/structAVCodecParserContext.html)
 - [CodecContext](CodecContext.md) For decoding parsed packets

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeCodecParser`\>

## Constructors

### Constructor

> **new CodecParser**(): `CodecParser`

Defined in: [src/lib/codec-parser.ts:56](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parser.ts#L56)

#### Returns

`CodecParser`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/codec-parser.ts:190](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parser.ts#L190)

Dispose of the codec parser.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling close().

#### Returns

`void`

#### Example

```typescript
{
  using parser = new CodecParser();
  parser.init(AV_CODEC_ID_H264);
  // Use parser...
} // Automatically closed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### close()

> **close**(): `void`

Defined in: [src/lib/codec-parser.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parser.ts#L160)

Close the codec parser.

Releases all resources associated with the parser.
The parser becomes invalid after calling this.

Direct mapping to av_parser_close().

#### Returns

`void`

#### Example

```typescript
parser.close();
// Parser is now invalid
```

#### See

 - [init](#init) To initialize
 - Symbol.dispose For automatic cleanup

***

### getNative()

> **getNative**(): `NativeCodecParser`

Defined in: [src/lib/codec-parser.ts:171](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parser.ts#L171)

**`Internal`**

Get the underlying native CodecParser object.

#### Returns

`NativeCodecParser`

The native CodecParser binding object

#### Implementation of

`NativeWrapper.getNative`

***

### init()

> **init**(`codecId`): `void`

Defined in: [src/lib/codec-parser.ts:84](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parser.ts#L84)

Initialize parser for specific codec.

Sets up the parser to handle a specific codec format.
Must be called before parsing data.

Direct mapping to av_parser_init().

#### Parameters

##### codecId

`AVCodecID`

Codec ID to parse

#### Returns

`void`

#### Throws

If codec parser not available

#### Example

```typescript
import { AV_CODEC_ID_AAC } from 'node-av/constants';

const parser = new CodecParser();
parser.init(AV_CODEC_ID_AAC);
// Parser ready for AAC ADTS streams
```

#### See

 - [parse2](#parse2) To parse data
 - [close](#close) To cleanup

***

### parse2()

> **parse2**(`codecContext`, `packet`, `data`, `pts`, `dts`, `pos`): `number`

Defined in: [src/lib/codec-parser.ts:139](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec-parser.ts#L139)

Parse bitstream data into packets.

Analyzes raw bitstream data and extracts complete codec frames.
May require multiple calls to accumulate enough data for a complete frame.
Returns the number of bytes consumed from the input buffer.

Direct mapping to av_parser_parse2().

#### Parameters

##### codecContext

[`CodecContext`](CodecContext.md)

Codec context for parser state

##### packet

[`Packet`](Packet.md)

Packet to receive parsed frame

##### data

`Buffer`

Raw bitstream data to parse

##### pts

`bigint`

Presentation timestamp for data

##### dts

`bigint`

Decoding timestamp for data

##### pos

`number`

Byte position in stream

#### Returns

`number`

Number of bytes consumed from data, negative on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

let offset = 0;
while (offset < rawData.length) {
  const remaining = rawData.subarray(offset);
  const ret = parser.parse2(
    codecContext,
    packet,
    remaining,
    pts,
    dts,
    offset
  );

  if (ret < 0) {
    FFmpegError.throwIfError(ret, 'parse2');
  }

  offset += ret;

  if (packet.size > 0) {
    // Got complete packet
    await processPacket(packet);
    packet.unref();
  }
}
```

#### See

[init](#init) To initialize parser
