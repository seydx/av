[node-av](../globals.md) / FilterContext

# Class: FilterContext

Defined in: [src/lib/filter-context.ts:48](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L48)

Filter instance in a filter graph.

Represents an instantiated filter within a filter graph. Each context contains
a specific filter configuration with its parameters, connections to other filters,
and input/output pads. Supports both software and hardware filtering operations.
Essential for building complex filter chains for audio/video processing.

Direct mapping to FFmpeg's AVFilterContext.

## Example

```typescript
import { FilterContext, FilterGraph, Filter, FFmpegError } from 'node-av';

// Create filter context in a graph
const graph = new FilterGraph();
const filter = Filter.getByName('scale');
const context = graph.createFilter(filter, 'scaler');

// Initialize with parameters
const ret = context.initStr('640:480');
FFmpegError.throwIfError(ret, 'initStr');

// Link filters together
const ret2 = source.link(0, context, 0);
FFmpegError.throwIfError(ret2, 'link');

// For buffer source/sink
const ret3 = await bufferSrc.buffersrcAddFrame(frame);
FFmpegError.throwIfError(ret3, 'buffersrcAddFrame');
```

## See

 - \[AVFilterContext\](https://ffmpeg.org/doxygen/trunk/structAVFilterContext.html)
 - [FilterGraph](FilterGraph.md) For managing filter graphs
 - [Filter](Filter.md) For filter descriptors

## Extends

- `OptionMember`\<`NativeFilterContext`\>

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeFilterContext`\>

## Constructors

### Constructor

> **new FilterContext**(`native`): `FilterContext`

Defined in: [src/lib/filter-context.ts:55](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L55)

**`Internal`**

#### Parameters

##### native

`NativeFilterContext`

The native filter context instance

#### Returns

`FilterContext`

#### Overrides

`OptionMember<NativeFilterContext>.constructor`

## Properties

### native

> `protected` **native**: `NativeFilterContext`

Defined in: [src/lib/option.ts:733](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L733)

#### Inherited from

`OptionMember.native`

## Accessors

### filter

#### Get Signature

> **get** **filter**(): `null` \| [`Filter`](Filter.md)

Defined in: [src/lib/filter-context.ts:82](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L82)

Filter descriptor.

Reference to the filter type this context instantiates.

Direct mapping to AVFilterContext->filter.

##### Returns

`null` \| [`Filter`](Filter.md)

***

### graph

#### Get Signature

> **get** **graph**(): `null` \| `NativeFilterGraph`

Defined in: [src/lib/filter-context.ts:94](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L94)

Parent filter graph.

Reference to the graph containing this filter context.

Direct mapping to AVFilterContext->graph.

##### Returns

`null` \| `NativeFilterGraph`

***

### hwDeviceCtx

#### Get Signature

> **get** **hwDeviceCtx**(): `null` \| [`HardwareDeviceContext`](HardwareDeviceContext.md)

Defined in: [src/lib/filter-context.ts:140](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L140)

Hardware device context.

Hardware acceleration context for GPU-based filtering.
Set to enable hardware-accelerated filter operations.

Direct mapping to AVFilterContext->hw_device_ctx.

##### Returns

`null` \| [`HardwareDeviceContext`](HardwareDeviceContext.md)

#### Set Signature

> **set** **hwDeviceCtx**(`value`): `void`

Defined in: [src/lib/filter-context.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L160)

##### Parameters

###### value

`null` | [`HardwareDeviceContext`](HardwareDeviceContext.md)

##### Returns

`void`

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/filter-context.ts:67](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L67)

Filter instance name.

User-assigned name for this filter instance in the graph.
Used for identification and debugging.

Direct mapping to AVFilterContext->name.

##### Returns

`null` \| `string`

#### Set Signature

> **set** **name**(`value`): `void`

Defined in: [src/lib/filter-context.ts:71](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L71)

##### Parameters

###### value

`null` | `string`

##### Returns

`void`

***

### nbInputs

#### Get Signature

> **get** **nbInputs**(): `number`

Defined in: [src/lib/filter-context.ts:105](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L105)

Number of input pads.

Total number of input connections this filter can accept.

Direct mapping to AVFilterContext->nb_inputs.

##### Returns

`number`

***

### nbOutputs

#### Get Signature

> **get** **nbOutputs**(): `number`

Defined in: [src/lib/filter-context.ts:116](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L116)

Number of output pads.

Total number of output connections this filter can provide.

Direct mapping to AVFilterContext->nb_outputs.

##### Returns

`number`

***

### ready

#### Get Signature

> **get** **ready**(): `number`

Defined in: [src/lib/filter-context.ts:128](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L128)

Filter readiness state.

Indicates if the filter is ready for processing.
Non-zero when ready.

Direct mapping to AVFilterContext->ready.

##### Returns

`number`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/filter-context.ts:686](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L686)

Dispose of the filter context.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using context = graph.createFilter(filter, 'test');
  context.initStr('640:480');
  // Use context...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### buffersinkGetChannelLayout()

> **buffersinkGetChannelLayout**(): [`ChannelLayout`](../interfaces/ChannelLayout.md)

Defined in: [src/lib/filter-context.ts:578](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L578)

Get channel layout from buffer sink.

Returns the channel layout of audio from a buffer sink filter.
Only valid for audio buffer sink filters.

Direct mapping to av_buffersink_get_channel_layout().

#### Returns

[`ChannelLayout`](../interfaces/ChannelLayout.md)

Channel layout configuration

#### Example

```typescript
const layout = bufferSink.buffersinkGetChannelLayout();
console.log(`Channels: ${layout.nbChannels}`);
```

***

### buffersinkGetFormat()

> **buffersinkGetFormat**(): `AVPixelFormat` \| `AVSampleFormat`

Defined in: [src/lib/filter-context.ts:456](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L456)

Get pixel/sample format from buffer sink.

Returns the format of frames from a buffer sink filter.
Only valid for buffer sink filters.

Direct mapping to av_buffersink_get_format().

#### Returns

`AVPixelFormat` \| `AVSampleFormat`

Pixel format for video, sample format for audio

#### Example

```typescript
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

const format = bufferSink.buffersinkGetFormat();
if (format === AV_PIX_FMT_YUV420P) {
  console.log('Output is YUV420P');
}
```

***

### buffersinkGetFrame()

> **buffersinkGetFrame**(`frame`): `Promise`\<`number`\>

Defined in: [src/lib/filter-context.ts:411](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L411)

Get a frame from a buffer sink filter.

Retrieves a filtered frame from the filter graph through a buffer sink.
Only valid for buffer sink filters.

Direct mapping to av_buffersink_get_frame().

#### Parameters

##### frame

[`Frame`](Frame.md)

Frame to receive filtered data

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: No frame available yet
  - AVERROR_EOF: No more frames will be produced
  - AVERROR_EINVAL: Not a buffer sink filter

#### Example

```typescript
import { FFmpegError, Frame } from 'node-av';
import { AVERROR_EAGAIN, AVERROR_EOF } from 'node-av/constants';

const frame = new Frame();
frame.alloc();

const ret = await bufferSink.buffersinkGetFrame(frame);
if (ret === AVERROR_EAGAIN) {
  // No frame available yet
} else if (ret === AVERROR_EOF) {
  // End of stream
} else {
  FFmpegError.throwIfError(ret, 'buffersinkGetFrame');
  // Process filtered frame
}
```

#### See

[buffersrcAddFrame](#buffersrcaddframe) To send frames for filtering

***

### buffersinkGetFrameRate()

> **buffersinkGetFrameRate**(): [`Rational`](Rational.md)

Defined in: [src/lib/filter-context.ts:537](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L537)

Get frame rate from buffer sink.

Returns the frame rate of video from a buffer sink filter.
Only valid for video buffer sink filters.

Direct mapping to av_buffersink_get_frame_rate().

#### Returns

[`Rational`](Rational.md)

Frame rate as Rational

#### Example

```typescript
const frameRate = bufferSink.buffersinkGetFrameRate();
console.log(`Frame rate: ${frameRate.num}/${frameRate.den} fps`);
```

***

### buffersinkGetHeight()

> **buffersinkGetHeight**(): `number`

Defined in: [src/lib/filter-context.ts:496](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L496)

Get frame height from buffer sink.

Returns the height of video frames from a buffer sink filter.
Only valid for video buffer sink filters.

Direct mapping to av_buffersink_get_h().

#### Returns

`number`

Frame height in pixels

#### Example

```typescript
const height = bufferSink.buffersinkGetHeight();
console.log(`Output height: ${height}px`);
```

***

### buffersinkGetSampleAspectRatio()

> **buffersinkGetSampleAspectRatio**(): [`Rational`](Rational.md)

Defined in: [src/lib/filter-context.ts:516](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L516)

Get sample aspect ratio from buffer sink.

Returns the pixel aspect ratio of video frames from a buffer sink filter.
Only valid for video buffer sink filters.

Direct mapping to av_buffersink_get_sample_aspect_ratio().

#### Returns

[`Rational`](Rational.md)

Sample aspect ratio as Rational

#### Example

```typescript
const sar = bufferSink.buffersinkGetSampleAspectRatio();
console.log(`SAR: ${sar.num}:${sar.den}`);
```

***

### buffersinkGetSampleRate()

> **buffersinkGetSampleRate**(): `number`

Defined in: [src/lib/filter-context.ts:558](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L558)

Get sample rate from buffer sink.

Returns the sample rate of audio from a buffer sink filter.
Only valid for audio buffer sink filters.

Direct mapping to av_buffersink_get_sample_rate().

#### Returns

`number`

Sample rate in Hz

#### Example

```typescript
const sampleRate = bufferSink.buffersinkGetSampleRate();
console.log(`Sample rate: ${sampleRate} Hz`);
```

***

### buffersinkGetTimeBase()

> **buffersinkGetTimeBase**(): [`Rational`](Rational.md)

Defined in: [src/lib/filter-context.ts:431](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L431)

Get time base from buffer sink.

Returns the time base of frames from a buffer sink filter.
Only valid for buffer sink filters.

Direct mapping to av_buffersink_get_time_base().

#### Returns

[`Rational`](Rational.md)

Time base as Rational

#### Example

```typescript
const timeBase = bufferSink.buffersinkGetTimeBase();
console.log(`Time base: ${timeBase.num}/${timeBase.den}`);
```

***

### buffersinkGetWidth()

> **buffersinkGetWidth**(): `number`

Defined in: [src/lib/filter-context.ts:476](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L476)

Get frame width from buffer sink.

Returns the width of video frames from a buffer sink filter.
Only valid for video buffer sink filters.

Direct mapping to av_buffersink_get_w().

#### Returns

`number`

Frame width in pixels

#### Example

```typescript
const width = bufferSink.buffersinkGetWidth();
console.log(`Output width: ${width}px`);
```

***

### buffersrcAddFrame()

> **buffersrcAddFrame**(`frame`): `Promise`\<`number`\>

Defined in: [src/lib/filter-context.ts:316](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L316)

Add a frame to a buffer source filter.

Sends a frame into the filter graph through a buffer source.
Only valid for buffer source filters. Send null to signal EOF.

Direct mapping to av_buffersrc_add_frame().

#### Parameters

##### frame

Frame to send, or null for EOF

`null` | [`Frame`](Frame.md)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EAGAIN: Filter needs more output consumption
  - AVERROR_EOF: Filter has been closed
  - AVERROR_EINVAL: Not a buffer source filter
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EAGAIN } from 'node-av/constants';

// Send frame to filter graph
const ret = await bufferSrc.buffersrcAddFrame(frame);
if (ret === AVERROR_EAGAIN) {
  // Need to consume output first
} else {
  FFmpegError.throwIfError(ret, 'buffersrcAddFrame');
}

// Signal EOF
await bufferSrc.buffersrcAddFrame(null);
```

#### See

[buffersinkGetFrame](#buffersinkgetframe) To retrieve filtered frames

***

### buffersrcParametersSet()

> **buffersrcParametersSet**(`params`): `number`

Defined in: [src/lib/filter-context.ts:358](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L358)

Set parameters for a buffer source filter.

Configures the format and properties of frames that will be sent
to the buffer source. Must be called before sending frames.

Direct mapping to av_buffersrc_parameters_set().

#### Parameters

##### params

Source parameters

###### channelLayout?

`bigint`

Audio channel layout

###### format?

`number`

Pixel or sample format

###### frameRate?

[`IRational`](../interfaces/IRational.md)

Video frame rate

###### height?

`number`

Video frame height

###### hwFramesCtx?

`null` \| [`HardwareFramesContext`](HardwareFramesContext.md)

Hardware frames context

###### sampleAspectRatio?

[`IRational`](../interfaces/IRational.md)

Pixel aspect ratio

###### sampleRate?

`number`

Audio sample rate

###### timeBase?

[`IRational`](../interfaces/IRational.md)

Time base for timestamps

###### width?

`number`

Video frame width

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError, Rational } from 'node-av';
import { AV_PIX_FMT_YUV420P } from 'node-av/constants';

// Configure video buffer source
const ret = bufferSrc.buffersrcParametersSet({
  width: 1920,
  height: 1080,
  format: AV_PIX_FMT_YUV420P,
  timeBase: { num: 1, den: 25 },
  frameRate: { num: 25, den: 1 }
});
FFmpegError.throwIfError(ret, 'buffersrcParametersSet');
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/filter-context.ts:598](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L598)

Free the filter context.

Releases all resources associated with the filter context.
The context becomes invalid after calling this.

Direct mapping to avfilter_free().

#### Returns

`void`

#### Example

```typescript
context.free();
// Context is now invalid
```

#### See

Symbol.dispose For automatic cleanup

***

### getNative()

> **getNative**(): `NativeFilterContext`

Defined in: [src/lib/filter-context.ts:667](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L667)

**`Internal`**

Get the underlying native FilterContext object.

#### Returns

`NativeFilterContext`

The native FilterContext binding object

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

> **init**(`options`): `number`

Defined in: [src/lib/filter-context.ts:190](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L190)

Initialize filter with dictionary options.

Configures the filter with key-value option pairs.
Must be called after creation and before processing.

Direct mapping to avfilter_init_dict().

#### Parameters

##### options

Dictionary of filter options

`null` | `NativeDictionary`

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const options = { width: '1920', height: '1080' };
const ret = context.init(options);
FFmpegError.throwIfError(ret, 'init');
```

#### See

[initStr](#initstr) For string-based initialization

***

### initStr()

> **initStr**(`args`): `number`

Defined in: [src/lib/filter-context.ts:222](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L222)

Initialize filter with string arguments.

Configures the filter using a string representation of parameters.
Format depends on the specific filter.

Direct mapping to avfilter_init_str().

#### Parameters

##### args

Filter arguments string

`null` | `string`

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid arguments
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Scale filter with width:height
const ret = scaleContext.initStr('1920:1080');
FFmpegError.throwIfError(ret, 'initStr');

// Crop filter with width:height:x:y
const ret2 = cropContext.initStr('640:480:100:50');
FFmpegError.throwIfError(ret2, 'initStr');
```

#### See

[init](#init) For dictionary-based initialization

***

### isReady()

> **isReady**(): `boolean`

Defined in: [src/lib/filter-context.ts:656](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L656)

Check if filter is ready.

Indicates whether the filter is ready for processing.

#### Returns

`boolean`

True if filter is ready

#### Example

```typescript
if (context.isReady()) {
  // Filter is ready for processing
}
```

***

### isSink()

> **isSink**(): `boolean`

Defined in: [src/lib/filter-context.ts:638](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L638)

Check if filter is a sink.

Sink filters consume frames without output.

#### Returns

`boolean`

True if filter has no outputs

#### Example

```typescript
if (context.isSink()) {
  console.log('This is a sink filter');
}
```

#### See

[isSource](#issource) To check for source filters

***

### isSource()

> **isSource**(): `boolean`

Defined in: [src/lib/filter-context.ts:618](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L618)

Check if filter is a source.

Source filters generate frames without input.

#### Returns

`boolean`

True if filter has no inputs

#### Example

```typescript
if (context.isSource()) {
  console.log('This is a source filter');
}
```

#### See

[isSink](#issink) To check for sink filters

***

### link()

> **link**(`srcPad`, `dst`, `dstPad`): `number`

Defined in: [src/lib/filter-context.ts:256](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L256)

Link this filter's output to another filter's input.

Creates a connection between two filters in the graph.
Data flows from this filter's output pad to the destination's input pad.

Direct mapping to avfilter_link().

#### Parameters

##### srcPad

`number`

Output pad index of this filter

##### dst

`FilterContext`

Destination filter context

##### dstPad

`number`

Input pad index of destination filter

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid pad indices or incompatible formats
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Link source output 0 to scale input 0
const ret = source.link(0, scale, 0);
FFmpegError.throwIfError(ret, 'link');

// Link scale output 0 to sink input 0
const ret2 = scale.link(0, sink, 0);
FFmpegError.throwIfError(ret2, 'link');
```

#### See

[unlink](#unlink) To disconnect filters

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

### unlink()

> **unlink**(`pad`): `void`

Defined in: [src/lib/filter-context.ts:278](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-context.ts#L278)

Unlink a filter pad.

Disconnects a pad from its linked filter.
Used to reconfigure filter connections.

Direct mapping to avfilter_link_free().

#### Parameters

##### pad

`number`

Pad index to unlink

#### Returns

`void`

#### Example

```typescript
// Disconnect output pad 0
context.unlink(0);
```

#### See

[link](#link) To connect filters
