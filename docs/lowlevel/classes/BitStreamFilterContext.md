[node-av](../globals.md) / BitStreamFilterContext

# Class: BitStreamFilterContext

Defined in: [src/lib/bitstream-filter-context.ts:56](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L56)

Bitstream filter context for processing compressed video/audio streams.

Applies bitstream filters to modify or analyze compressed packets without
full decoding/encoding. Common uses include format conversion (e.g., H.264 MP4 to Annex B),
metadata extraction, parameter set manipulation, and packet splitting/merging.
Essential for stream compatibility between different containers and decoders.

Direct mapping to FFmpeg's AVBSFContext.

## Example

```typescript
import { BitStreamFilterContext, BitStreamFilter, Packet, FFmpegError } from 'node-av';

// Create and initialize H.264 stream format converter
const ctx = new BitStreamFilterContext();
const filter = BitStreamFilter.getByName('h264_mp4toannexb');
if (!filter) {
  throw new Error('H.264 filter not available');
}

let ret = ctx.alloc(filter);
FFmpegError.throwIfError(ret, 'alloc');

ret = ctx.init();
FFmpegError.throwIfError(ret, 'init');

// Process packets
const inputPacket = new Packet();
const outputPacket = new Packet();

ret = await ctx.sendPacket(inputPacket);
FFmpegError.throwIfError(ret, 'sendPacket');

ret = await ctx.receivePacket(outputPacket);
if (ret >= 0) {
  // Process filtered packet
}

// Cleanup
ctx.free();
```

## See

 - [BitStreamFilter](BitStreamFilter.md) For available filter types
 - [Packet](Packet.md) For packet manipulation

## Extends

- `OptionMember`\<`NativeBitStreamFilterContext`\>

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeBitStreamFilterContext`\>

## Constructors

### Constructor

> **new BitStreamFilterContext**(): `BitStreamFilterContext`

Defined in: [src/lib/bitstream-filter-context.ts:59](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L59)

#### Returns

`BitStreamFilterContext`

#### Overrides

`OptionMember<NativeBitStreamFilterContext>.constructor`

## Properties

### native

> `protected` **native**: `NativeBitStreamFilterContext`

Defined in: [src/lib/option.ts:733](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L733)

#### Inherited from

`OptionMember.native`

## Accessors

### filter

#### Get Signature

> **get** **filter**(): `null` \| [`BitStreamFilter`](BitStreamFilter.md)

Defined in: [src/lib/bitstream-filter-context.ts:150](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L150)

The bitstream filter being used.

Reference to the filter descriptor allocated to this context.

Direct mapping to AVBSFContext->filter.

##### Returns

`null` \| [`BitStreamFilter`](BitStreamFilter.md)

***

### inputCodecParameters

#### Get Signature

> **get** **inputCodecParameters**(): `null` \| [`CodecParameters`](CodecParameters.md)

Defined in: [src/lib/bitstream-filter-context.ts:81](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L81)

Input codec parameters.

Parameters describing the input stream format.
These are automatically configured from the input packets in most cases.

Direct mapping to AVBSFContext->par_in.

##### Returns

`null` \| [`CodecParameters`](CodecParameters.md)

***

### inputTimeBase

#### Get Signature

> **get** **inputTimeBase**(): [`Rational`](Rational.md)

Defined in: [src/lib/bitstream-filter-context.ts:120](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L120)

Input time base.

Time base of the input packets (timestamps per second).
Must be set before init() for proper timestamp handling.

Direct mapping to AVBSFContext->time_base_in.

##### Returns

[`Rational`](Rational.md)

#### Set Signature

> **set** **inputTimeBase**(`value`): `void`

Defined in: [src/lib/bitstream-filter-context.ts:125](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L125)

##### Parameters

###### value

[`Rational`](Rational.md)

##### Returns

`void`

***

### isInitialized

#### Get Signature

> **get** **isInitialized**(): `boolean`

Defined in: [src/lib/bitstream-filter-context.ts:69](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L69)

Check if the context has been initialized.

Returns true if init() has been successfully called.
The context must be initialized before sending/receiving packets.

##### Returns

`boolean`

***

### outputCodecParameters

#### Get Signature

> **get** **outputCodecParameters**(): `null` \| [`CodecParameters`](CodecParameters.md)

Defined in: [src/lib/bitstream-filter-context.ts:101](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L101)

Output codec parameters.

Parameters describing the output stream format after filtering.
These reflect any changes made by the bitstream filter.

Direct mapping to AVBSFContext->par_out.

##### Returns

`null` \| [`CodecParameters`](CodecParameters.md)

***

### outputTimeBase

#### Get Signature

> **get** **outputTimeBase**(): `null` \| [`Rational`](Rational.md)

Defined in: [src/lib/bitstream-filter-context.ts:137](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L137)

Output time base.

Time base of the output packets after filtering.
May differ from input if the filter modifies timing.

Direct mapping to AVBSFContext->time_base_out.

##### Returns

`null` \| [`Rational`](Rational.md)

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/bitstream-filter-context.ts:374](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L374)

Dispose of the bitstream filter context.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using ctx = new BitStreamFilterContext();
  ctx.alloc(filter);
  ctx.init();
  // Use context...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(`filter`): `number`

Defined in: [src/lib/bitstream-filter-context.ts:190](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L190)

Allocate a bitstream filter context.

Allocates and configures the context for the specified filter.
Must be called before init().

Direct mapping to av_bsf_alloc().

#### Parameters

##### filter

[`BitStreamFilter`](BitStreamFilter.md)

The bitstream filter to use

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_EINVAL: Invalid filter

#### Example

```typescript
import { FFmpegError } from 'node-av';

const filter = BitStreamFilter.getByName('h264_mp4toannexb');
if (!filter) {
  throw new Error('Filter not found');
}

const ret = ctx.alloc(filter);
FFmpegError.throwIfError(ret, 'alloc');
```

#### See

 - [init](#init) To initialize after allocation
 - [BitStreamFilter.getByName](BitStreamFilter.md#getbyname) To get filter by name

***

### flush()

> **flush**(): `void`

Defined in: [src/lib/bitstream-filter-context.ts:265](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L265)

Flush the bitstream filter.

Resets the internal state and discards any buffered data.
Useful when seeking or switching streams.

Direct mapping to av_bsf_flush().

#### Returns

`void`

#### Example

```typescript
// Flush when seeking
ctx.flush();
// Now ready to process packets from new position
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/bitstream-filter-context.ts:245](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L245)

Free the bitstream filter context.

Releases all resources associated with the context.
The context becomes invalid after calling this.

Direct mapping to av_bsf_free().

#### Returns

`void`

#### Example

```typescript
ctx.free();
// Context is now invalid
```

#### See

 - Symbol.dispose For automatic cleanup
 - [alloc](#alloc) To allocate

***

### getNative()

> **getNative**(): `NativeBitStreamFilterContext`

Defined in: [src/lib/bitstream-filter-context.ts:354](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L354)

**`Internal`**

Get the underlying native BitStreamFilterContext object.

#### Returns

`NativeBitStreamFilterContext`

The native BitStreamFilterContext binding object

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

### init()

> **init**(): `number`

Defined in: [src/lib/bitstream-filter-context.ts:224](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L224)

Initialize the bitstream filter context.

Initializes the filter with the configured parameters.
Must be called after alloc() and before processing packets.

Direct mapping to av_bsf_init().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Allocate and initialize
const ret1 = ctx.alloc(filter);
FFmpegError.throwIfError(ret1, 'alloc');

// Set parameters if needed
ctx.inputTimeBase = new Rational(1, 25);

const ret2 = ctx.init();
FFmpegError.throwIfError(ret2, 'init');
```

#### See

 - [alloc](#alloc) Must be called first
 - [isInitialized](#isinitialized) To check initialization status

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

### receivePacket()

> **receivePacket**(`packet`): `Promise`\<`number`\>

Defined in: [src/lib/bitstream-filter-context.ts:343](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L343)

Receive a filtered packet from the bitstream filter.

Retrieves a packet that has been processed by the filter.
May need to be called multiple times after each sendPacket().

Direct mapping to av_bsf_receive_packet().

#### Parameters

##### packet

[`Packet`](Packet.md)

Packet to receive filtered data into

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: Need more input
  - AVERROR_EOF: No more packets available
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EAGAIN, AVERROR_EOF } from 'node-av';

// Receive all available packets
while (true) {
  const ret = await ctx.receivePacket(outputPacket);
  if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
    break;
  }
  FFmpegError.throwIfError(ret, 'receivePacket');

  // Process filtered packet
  console.log(`Filtered packet size: ${outputPacket.size}`);
}
```

#### See

[sendPacket](#sendpacket) To submit packets for filtering

***

### sendPacket()

> **sendPacket**(`packet`): `Promise`\<`number`\>

Defined in: [src/lib/bitstream-filter-context.ts:305](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter-context.ts#L305)

Send a packet to the bitstream filter.

Submits a packet for filtering. The filter may buffer the packet
internally and require multiple calls to receivePacket() to retrieve
all output. Send null to signal end of stream.

Direct mapping to av_bsf_send_packet().

#### Parameters

##### packet

Packet to filter, or null to signal EOF

`null` | [`Packet`](Packet.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: Filter needs output to be consumed first
  - AVERROR_EOF: Filter has been flushed
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EAGAIN } from 'node-av';

const ret = await ctx.sendPacket(inputPacket);
if (ret === AVERROR_EAGAIN) {
  // Need to receive packets first
  const ret2 = await ctx.receivePacket(outputPacket);
  FFmpegError.throwIfError(ret2, 'receivePacket');
} else {
  FFmpegError.throwIfError(ret, 'sendPacket');
}

// Send EOF
await ctx.sendPacket(null);
```

#### See

[receivePacket](#receivepacket) To retrieve filtered packets

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
