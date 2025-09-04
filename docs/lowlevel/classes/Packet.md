[node-av](../globals.md) / Packet

# Class: Packet

Defined in: [src/lib/packet.ts:48](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L48)

Container for compressed audio/video data.

Stores encoded data from demuxers or to be sent to muxers. Each packet contains
a portion of compressed stream data, typically one video frame or several audio frames.
Includes timing information (PTS/DTS), stream index, and flags. Essential for
demuxing, muxing, and codec operations.

Direct mapping to FFmpeg's AVPacket.

## Example

```typescript
import { Packet, FFmpegError } from 'node-av';
import { AV_PKT_FLAG_KEY } from 'node-av/constants';

// Create and allocate packet
const packet = new Packet();
packet.alloc();

// Read packet from format context
const ret = await formatContext.readFrame(packet);
FFmpegError.throwIfError(ret, 'readFrame');

// Check packet properties
console.log(`Stream: ${packet.streamIndex}`);
console.log(`PTS: ${packet.pts}`);
console.log(`Size: ${packet.size} bytes`);
console.log(`Keyframe: ${packet.isKeyframe}`);

// Send to decoder
const ret2 = await codecContext.sendPacket(packet);
FFmpegError.throwIfError(ret2, 'sendPacket');

// Cleanup
packet.unref();
```

## See

 - \[AVPacket\](https://ffmpeg.org/doxygen/trunk/structAVPacket.html)
 - [FormatContext](FormatContext.md) For reading/writing packets
 - [CodecContext](CodecContext.md) For encoding/decoding packets

## Implements

- `Disposable`
- `NativeWrapper`\<`NativePacket`\>

## Constructors

### Constructor

> **new Packet**(): `Packet`

Defined in: [src/lib/packet.ts:51](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L51)

#### Returns

`Packet`

## Accessors

### data

#### Get Signature

> **get** **data**(): `null` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [src/lib/packet.ts:168](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L168)

Packet data buffer.

Contains the compressed audio/video data.
May be null for packets signaling special conditions.

Direct mapping to AVPacket->data.

##### Returns

`null` \| `Buffer`\<`ArrayBufferLike`\>

#### Set Signature

> **set** **data**(`value`): `void`

Defined in: [src/lib/packet.ts:172](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L172)

##### Parameters

###### value

`null` | `Buffer`\<`ArrayBufferLike`\>

##### Returns

`void`

***

### dts

#### Get Signature

> **get** **dts**(): `bigint`

Defined in: [src/lib/packet.ts:95](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L95)

Decompression timestamp.

Time when the packet should be decompressed.
In stream time base units. AV_NOPTS_VALUE if unknown.

Direct mapping to AVPacket->dts.

##### Returns

`bigint`

#### Set Signature

> **set** **dts**(`value`): `void`

Defined in: [src/lib/packet.ts:99](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L99)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### duration

#### Get Signature

> **get** **duration**(): `bigint`

Defined in: [src/lib/packet.ts:111](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L111)

Duration of this packet.

Duration in stream time base units, 0 if unknown.
Typically equal to next_pts - this_pts.

Direct mapping to AVPacket->duration.

##### Returns

`bigint`

#### Set Signature

> **set** **duration**(`value`): `void`

Defined in: [src/lib/packet.ts:115](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L115)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### flags

#### Get Signature

> **get** **flags**(): `AVPacketFlag`

Defined in: [src/lib/packet.ts:152](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L152)

Packet flags.

Combination of AV_PKT_FLAG values indicating packet properties
(e.g., AV_PKT_FLAG_KEY for keyframes).

Direct mapping to AVPacket->flags.

##### Returns

`AVPacketFlag`

#### Set Signature

> **set** **flags**(`value`): `void`

Defined in: [src/lib/packet.ts:156](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L156)

##### Parameters

###### value

`AVPacketFlag`

##### Returns

`void`

***

### isKeyframe

#### Get Signature

> **get** **isKeyframe**(): `boolean`

Defined in: [src/lib/packet.ts:182](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L182)

Check if packet contains a keyframe.

Convenience property that checks AV_PKT_FLAG_KEY flag.
Keyframes can be decoded independently without reference frames.

##### Returns

`boolean`

#### Set Signature

> **set** **isKeyframe**(`value`): `void`

Defined in: [src/lib/packet.ts:186](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L186)

##### Parameters

###### value

`boolean`

##### Returns

`void`

***

### pos

#### Get Signature

> **get** **pos**(): `bigint`

Defined in: [src/lib/packet.ts:127](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L127)

Byte position in stream.

Byte position of packet data in the input file.
-1 if unknown.

Direct mapping to AVPacket->pos.

##### Returns

`bigint`

#### Set Signature

> **set** **pos**(`value`): `void`

Defined in: [src/lib/packet.ts:131](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L131)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### pts

#### Get Signature

> **get** **pts**(): `bigint`

Defined in: [src/lib/packet.ts:79](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L79)

Presentation timestamp.

Time when the decompressed packet should be presented to the user.
In stream time base units. AV_NOPTS_VALUE if unknown.

Direct mapping to AVPacket->pts.

##### Returns

`bigint`

#### Set Signature

> **set** **pts**(`value`): `void`

Defined in: [src/lib/packet.ts:83](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L83)

##### Parameters

###### value

`bigint`

##### Returns

`void`

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [src/lib/packet.ts:140](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L140)

Size of packet data in bytes.

Direct mapping to AVPacket->size.

##### Returns

`number`

***

### streamIndex

#### Get Signature

> **get** **streamIndex**(): `number`

Defined in: [src/lib/packet.ts:63](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L63)

Stream index this packet belongs to.

Identifies which stream in a format context this packet is from/for.
Set automatically when reading, must be set manually when writing.

Direct mapping to AVPacket->stream_index.

##### Returns

`number`

#### Set Signature

> **set** **streamIndex**(`value`): `void`

Defined in: [src/lib/packet.ts:67](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L67)

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/packet.ts:523](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L523)

Dispose of the packet.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using packet = new Packet();
  packet.alloc();
  // Use packet...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### addSideData()

> **addSideData**(`type`, `data`): `number`

Defined in: [src/lib/packet.ts:446](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L446)

Add side data to packet.

Attaches additional data to the packet. The data is copied.

Direct mapping to av_packet_add_side_data().

#### Parameters

##### type

`AVPacketSideDataType`

Type of side data

##### data

`Buffer`

Side data buffer

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_PKT_DATA_NEW_EXTRADATA } from 'node-av/constants';

const extradata = Buffer.from([...]);
const ret = packet.addSideData(AV_PKT_DATA_NEW_EXTRADATA, extradata);
FFmpegError.throwIfError(ret, 'addSideData');
```

#### See

 - [getSideData](#getsidedata) To retrieve side data
 - [newSideData](#newsidedata) To allocate in-place

***

### alloc()

> **alloc**(): `void`

Defined in: [src/lib/packet.ts:209](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L209)

Allocate a new packet.

Allocates the packet structure. Must be called before using the packet
unless it was created by another function (e.g., clone()).

Direct mapping to av_packet_alloc().

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
const packet = new Packet();
packet.alloc();
// Packet is now ready for use
```

#### See

[free](#free) To deallocate the packet

***

### clone()

> **clone**(): `null` \| `Packet`

Defined in: [src/lib/packet.ts:305](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L305)

Clone the packet.

Creates an independent copy of the packet with its own data buffer.
The new packet has the same content but can be modified independently.

Direct mapping to av_packet_clone().

#### Returns

`null` \| `Packet`

New packet instance, or null on allocation failure

#### Example

```typescript
const copy = packet.clone();
if (copy) {
  // Modify copy without affecting original
  copy.pts = packet.pts + 1000n;
}
```

#### See

[ref](#ref) To create reference instead of copy

***

### free()

> **free**(): `void`

Defined in: [src/lib/packet.ts:228](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L228)

Free the packet.

Deallocates the packet and its data. The packet becomes invalid after this.

Direct mapping to av_packet_free().

#### Returns

`void`

#### Example

```typescript
packet.free();
// Packet is now invalid
```

#### See

[unref](#unref) To only free data, keeping structure

***

### freeSideData()

> **freeSideData**(): `void`

Defined in: [src/lib/packet.ts:493](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L493)

Free all side data.

Removes all side data attached to the packet.

Direct mapping to av_packet_free_side_data().

#### Returns

`void`

#### Example

```typescript
packet.freeSideData();
// All side data removed
```

***

### getNative()

> **getNative**(): `NativePacket`

Defined in: [src/lib/packet.ts:504](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L504)

**`Internal`**

Get the underlying native Packet object.

#### Returns

`NativePacket`

The native Packet binding object

#### Implementation of

`NativeWrapper.getNative`

***

### getSideData()

> **getSideData**(`type`): `null` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [src/lib/packet.ts:416](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L416)

Get packet side data.

Retrieves additional data associated with the packet
(e.g., palette data, quality stats, encryption info).

Direct mapping to av_packet_get_side_data().

#### Parameters

##### type

`AVPacketSideDataType`

Type of side data to retrieve

#### Returns

`null` \| `Buffer`\<`ArrayBufferLike`\>

Side data buffer, or null if not present

#### Example

```typescript
import { AV_PKT_DATA_PALETTE } from 'node-av/constants';

const palette = packet.getSideData(AV_PKT_DATA_PALETTE);
if (palette) {
  console.log(`Palette size: ${palette.length} bytes`);
}
```

#### See

 - [addSideData](#addsidedata) To add side data
 - [newSideData](#newsidedata) To allocate new side data

***

### makeRefcounted()

> **makeRefcounted**(): `number`

Defined in: [src/lib/packet.ts:362](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L362)

Ensure packet data is reference counted.

Makes sure the packet data is stored in a reference-counted buffer.
If not already reference-counted, allocates a new buffer and copies data.

Direct mapping to av_packet_make_refcounted().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid packet

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = packet.makeRefcounted();
FFmpegError.throwIfError(ret, 'makeRefcounted');
```

***

### makeWritable()

> **makeWritable**(): `number`

Defined in: [src/lib/packet.ts:388](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L388)

Ensure packet data is writable.

Creates a private copy of the data if it's shared with other packets.
Call before modifying packet data to avoid affecting other references.

Direct mapping to av_packet_make_writable().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid packet

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Ensure we can safely modify data
const ret = packet.makeWritable();
FFmpegError.throwIfError(ret, 'makeWritable');
// Now safe to modify packet.data
```

***

### newSideData()

> **newSideData**(`type`, `size`): `Buffer`

Defined in: [src/lib/packet.ts:476](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L476)

Allocate new side data.

Allocates side data buffer attached to the packet.
Returns buffer that can be written to directly.

Direct mapping to av_packet_new_side_data().

#### Parameters

##### type

`AVPacketSideDataType`

Type of side data

##### size

`number`

Size in bytes to allocate

#### Returns

`Buffer`

Allocated buffer for writing

#### Throws

If allocation fails

#### Example

```typescript
import { AV_PKT_DATA_NEW_EXTRADATA } from 'node-av/constants';

// Allocate and write side data directly
const sideData = packet.newSideData(AV_PKT_DATA_NEW_EXTRADATA, 16);
sideData.writeUInt32LE(0x12345678, 0);
```

#### See

 - [getSideData](#getsidedata) To retrieve side data
 - [addSideData](#addsidedata) To add existing buffer

***

### ref()

> **ref**(`src`): `number`

Defined in: [src/lib/packet.ts:259](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L259)

Create a reference to another packet.

Sets up this packet as a reference to the source packet's data.
Both packets will share the same data buffer.

Direct mapping to av_packet_ref().

#### Parameters

##### src

`Packet`

Source packet to reference

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';

const packet2 = new Packet();
packet2.alloc();
const ret = packet2.ref(packet1);
FFmpegError.throwIfError(ret, 'ref');
// packet2 now references packet1's data
```

#### See

 - [unref](#unref) To remove reference
 - [clone](#clone) To create independent copy

***

### rescaleTs()

> **rescaleTs**(`srcTimebase`, `dstTimebase`): `void`

Defined in: [src/lib/packet.ts:338](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L338)

Rescale packet timestamps.

Converts PTS, DTS, and duration from one time base to another.
Essential when moving packets between streams with different time bases.

Direct mapping to av_packet_rescale_ts().

#### Parameters

##### srcTimebase

[`IRational`](../interfaces/IRational.md)

Source time base

##### dstTimebase

[`IRational`](../interfaces/IRational.md)

Destination time base

#### Returns

`void`

#### Example

```typescript
import { Rational } from 'node-av';

// Convert from 1/25 fps to 1/1000 (milliseconds)
const src = new Rational(1, 25);
const dst = new Rational(1, 1000);
packet.rescaleTs(src, dst);
```

***

### unref()

> **unref**(): `void`

Defined in: [src/lib/packet.ts:280](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/packet.ts#L280)

Unreference the packet.

Frees the packet data if this was the last reference.
The packet structure remains allocated and can be reused.

Direct mapping to av_packet_unref().

#### Returns

`void`

#### Example

```typescript
packet.unref();
// Packet data is freed, structure can be reused
```

#### See

 - [ref](#ref) To create reference
 - [free](#free) To free everything
