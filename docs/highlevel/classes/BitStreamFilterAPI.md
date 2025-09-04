[node-av](../globals.md) / BitStreamFilterAPI

# Class: BitStreamFilterAPI

Defined in: [bitstream-filter.ts:44](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L44)

High-level bitstream filter for packet processing.

Provides simplified interface for applying bitstream filters to packets.
Handles filter initialization, packet processing, and memory management.
Supports filters like h264_mp4toannexb, hevc_mp4toannexb, aac_adtstoasc.
Essential for format conversion and stream compatibility in transcoding pipelines.

## Examples

```typescript
import { BitStreamFilterAPI } from '@seydx/av/api';

// Create H.264 Annex B converter
const filter = BitStreamFilterAPI.create('h264_mp4toannexb', stream);

// Process packet
const outputPackets = await filter.process(inputPacket);
for (const packet of outputPackets) {
  await output.writePacket(packet);
  packet.free();
}
```

```typescript
// Process packet stream
const filter = BitStreamFilterAPI.create('hevc_mp4toannexb', videoStream);

for await (const packet of filter.packets(input.packets())) {
  await output.writePacket(packet);
  packet.free();
}
```

## See

 - BitStreamFilter For available filters
 - BitStreamFilterContext For low-level API
 - [MediaOutput](MediaOutput.md) For writing filtered packets

## Implements

- `Disposable`

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [bitstream-filter.ts:143](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L143)

Get filter name.

##### Example

```typescript
console.log(`Using filter: ${filter.name}`);
```

##### Returns

`string`

***

### outputCodecParameters

#### Get Signature

> **get** **outputCodecParameters**(): `null` \| `CodecParameters`

Defined in: [bitstream-filter.ts:159](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L159)

Get output codec parameters.

Parameters after filter processing.
May differ from input parameters.

##### Example

```typescript
const outputParams = filter.outputCodecParameters;
console.log(`Output codec: ${outputParams?.codecId}`);
```

##### Returns

`null` \| `CodecParameters`

***

### outputTimeBase

#### Get Signature

> **get** **outputTimeBase**(): `null` \| `Rational`

Defined in: [bitstream-filter.ts:174](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L174)

Get output time base.

Time base after filter processing.

##### Example

```typescript
const tb = filter.outputTimeBase;
console.log(`Output timebase: ${tb?.num}/${tb?.den}`);
```

##### Returns

`null` \| `Rational`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [bitstream-filter.ts:456](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L456)

Dispose of filter.

Implements Disposable interface for automatic cleanup.
Equivalent to calling dispose().

#### Returns

`void`

#### Example

```typescript
{
  using filter = BitStreamFilterAPI.create('h264_mp4toannexb', stream);
  // Use filter...
} // Automatically disposed
```

#### See

[dispose](#dispose-2) For manual cleanup

#### Implementation of

`Disposable.[dispose]`

***

### dispose()

> **dispose**(): `void`

Defined in: [bitstream-filter.ts:433](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L433)

Dispose of filter and free resources.

Releases filter context and marks as disposed.
Safe to call multiple times.

#### Returns

`void`

#### Example

```typescript
filter.dispose();
```

#### See

Symbol.dispose For automatic cleanup

***

### flush()

> **flush**(): `Promise`\<`Packet`[]\>

Defined in: [bitstream-filter.ts:333](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L333)

Flush filter and get remaining packets.

Signals end-of-stream and retrieves buffered packets.
Also resets internal filter state.

Direct mapping to av_bsf_flush().

#### Returns

`Promise`\<`Packet`[]\>

Array of remaining packets

#### Throws

If filter is disposed

#### Example

```typescript
const remaining = await filter.flush();
for (const packet of remaining) {
  await output.writePacket(packet);
  packet.free();
}
```

#### See

 - [flushPackets](#flushpackets) For async iteration
 - [reset](#reset) For state reset only

***

### flushPackets()

> **flushPackets**(): `AsyncGenerator`\<`Packet`\>

Defined in: [bitstream-filter.ts:366](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L366)

Flush filter as async generator.

Convenient async iteration over remaining packets.
Combines flush and iteration.

#### Returns

`AsyncGenerator`\<`Packet`\>

#### Yields

Remaining packets

#### Throws

If filter is disposed

#### Example

```typescript
for await (const packet of filter.flushPackets()) {
  await output.writePacket(packet);
  packet.free();
}
```

#### See

[flush](#flush) For array return

***

### getStream()

> **getStream**(): `Stream`

Defined in: [bitstream-filter.ts:390](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L390)

Get associated stream.

Returns the stream this filter was created for.

#### Returns

`Stream`

Associated stream

#### Example

```typescript
const stream = filter.getStream();
console.log(`Filtering stream ${stream.index}`);
```

***

### packets()

> **packets**(`packets`): `AsyncGenerator`\<`Packet`\>

Defined in: [bitstream-filter.ts:283](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L283)

Process packet stream through filter.

High-level async generator for filtering packet streams.
Automatically handles flushing at end of stream.
Yields filtered packets ready for output.

#### Parameters

##### packets

`AsyncIterable`\<`Packet`\>

Async iterable of packets

#### Returns

`AsyncGenerator`\<`Packet`\>

#### Yields

Filtered packets

#### Throws

If filter is disposed

#### Throws

If filtering fails

#### Examples

```typescript
// Filter entire stream
for await (const packet of filter.packets(input.packets())) {
  await output.writePacket(packet);
  packet.free();
}
```

```typescript
// Chain with decoder
const decoder = await Decoder.create(stream);
const filter = BitStreamFilterAPI.create('h264_mp4toannexb', stream);

for await (const frame of decoder.frames(filter.packets(input.packets()))) {
  // Process frames
  frame.free();
}
```

#### See

 - [process](#process) For single packet filtering
 - [flush](#flush) For end-of-stream handling

***

### process()

> **process**(`packet`): `Promise`\<`Packet`[]\>

Defined in: [bitstream-filter.ts:211](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L211)

Process a packet through the filter.

Applies bitstream filter to packet.
May produce zero, one, or multiple output packets.
Pass null to signal end-of-stream.

Direct mapping to av_bsf_send_packet() and av_bsf_receive_packet().

#### Parameters

##### packet

Packet to filter or null for EOF

`null` | `Packet`

#### Returns

`Promise`\<`Packet`[]\>

Array of filtered packets

#### Throws

If filter is disposed

#### Throws

If filtering fails

#### Examples

```typescript
const outputPackets = await filter.process(inputPacket);
for (const packet of outputPackets) {
  console.log(`Filtered packet: pts=${packet.pts}`);
  packet.free();
}
```

```typescript
// Flush filter
const remaining = await filter.process(null);
```

#### See

 - [flush](#flush) For explicit flushing
 - [packets](#packets) For stream processing

***

### reset()

> **reset**(): `void`

Defined in: [bitstream-filter.ts:412](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L412)

Reset filter state.

Clears internal buffers and resets filter.
Does not dispose resources.

Direct mapping to av_bsf_flush().

#### Returns

`void`

#### Throws

If filter is disposed

#### Example

```typescript
// Reset for new segment
filter.reset();
```

#### See

[flush](#flush) For reset with packet retrieval

***

### create()

> `static` **create**(`filterName`, `stream`): `BitStreamFilterAPI`

Defined in: [bitstream-filter.ts:97](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/bitstream-filter.ts#L97)

Create a bitstream filter for a stream.

Initializes filter with stream codec parameters.
Configures time base and prepares for packet processing.

Direct mapping to av_bsf_get_by_name() and av_bsf_alloc().

#### Parameters

##### filterName

`string`

Name of the bitstream filter

##### stream

`Stream`

Stream to apply filter to

#### Returns

`BitStreamFilterAPI`

Configured bitstream filter

#### Throws

If filter not found or initialization fails

#### Throws

If allocation or initialization fails

#### Examples

```typescript
// H.264 MP4 to Annex B conversion
const filter = BitStreamFilterAPI.create('h264_mp4toannexb', videoStream);
```

```typescript
// AAC ADTS to ASC conversion
const filter = BitStreamFilterAPI.create('aac_adtstoasc', audioStream);
```

```typescript
// Remove metadata
const filter = BitStreamFilterAPI.create('filter_units', stream);
```

#### See

BitStreamFilter.getByName For filter discovery
