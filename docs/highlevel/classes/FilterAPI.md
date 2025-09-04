[node-av](../globals.md) / FilterAPI

# Class: FilterAPI

Defined in: [filter.ts:47](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L47)

High-level filter API for audio and video processing.

Provides simplified interface for applying FFmpeg filters to frames.
Handles filter graph construction, frame buffering, and command control.
Supports both software and hardware-accelerated filtering operations.
Essential component for effects, transformations, and format conversions.

## Examples

```typescript
import { FilterAPI } from '@seydx/av/api';

// Create video filter
const filter = await FilterAPI.create('scale=1280:720', videoInfo);

// Process frame
const output = await filter.process(inputFrame);
if (output) {
  console.log(`Filtered frame: ${output.width}x${output.height}`);
  output.free();
}
```

```typescript
// Hardware-accelerated filtering
const hw = await HardwareContext.auto();
const filter = await FilterAPI.create(
  'hwupload,scale_cuda=1920:1080,hwdownload',
  videoInfo,
  { hardware: hw }
);
```

## See

 - FilterGraph For low-level filter graph API
 - [HardwareContext](HardwareContext.md) For hardware acceleration
 - Frame For frame operations

## Implements

- `Disposable`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [filter.ts:865](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L865)

Dispose of filter.

Implements Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using filter = await FilterAPI.create('scale=640:480', info);
  // Use filter...
} // Automatically freed
```

#### See

[free](#free) For manual cleanup

#### Implementation of

`Disposable.[dispose]`

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [filter.ts:344](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L344)

Flush filter and signal end-of-stream.

Sends null frame to flush buffered data.
Must call receive() to get flushed frames.

Direct mapping to av_buffersrc_add_frame(NULL).

#### Returns

`Promise`\<`void`\>

#### Throws

If filter not ready

#### Throws

If flush fails

#### Example

```typescript
await filter.flush();
// Get remaining frames
let frame;
while ((frame = await filter.receive()) !== null) {
  frame.free();
}
```

#### See

 - [flushFrames](#flushframes) For async iteration
 - [receive](#receive) For draining frames

***

### flushFrames()

> **flushFrames**(): `AsyncGenerator`\<`Frame`\>

Defined in: [filter.ts:376](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L376)

Flush filter and yield remaining frames.

Convenient async generator for flushing.
Combines flush and receive operations.

#### Returns

`AsyncGenerator`\<`Frame`\>

#### Yields

Remaining frames from filter

#### Throws

If filter not ready

#### Throws

If flush fails

#### Example

```typescript
for await (const frame of filter.flushFrames()) {
  console.log(`Flushed frame: pts=${frame.pts}`);
  frame.free();
}
```

#### See

 - [flush](#flush) For manual flush
 - [frames](#frames) For complete pipeline

***

### frames()

> **frames**(`frames`): `AsyncGenerator`\<`Frame`\>

Defined in: [filter.ts:427](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L427)

Process frame stream through filter.

High-level async generator for filtering frame streams.
Automatically handles buffering and flushing.
Frees input frames after processing.

#### Parameters

##### frames

`AsyncGenerator`\<`Frame`\>

Async generator of input frames

#### Returns

`AsyncGenerator`\<`Frame`\>

#### Yields

Filtered frames

#### Throws

If filter not ready

#### Throws

If processing fails

#### Examples

```typescript
// Filter decoded frames
for await (const frame of filter.frames(decoder.frames(packets))) {
  await encoder.encode(frame);
  frame.free();
}
```

```typescript
// Chain filters
const filter1 = await FilterAPI.create('scale=640:480', info);
const filter2 = await FilterAPI.create('rotate=PI/4', info);

for await (const frame of filter2.frames(filter1.frames(input))) {
  // Process filtered frames
  frame.free();
}
```

#### See

 - [process](#process) For single frame processing
 - [flush](#flush) For end-of-stream handling

***

### free()

> **free**(): `void`

Defined in: [filter.ts:598](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L598)

Free filter resources.

Releases filter graph and contexts.
Safe to call multiple times.

#### Returns

`void`

#### Example

```typescript
filter.free();
```

#### See

Symbol.dispose For automatic cleanup

***

### getGraphDescription()

> **getGraphDescription**(): `null` \| `string`

Defined in: [filter.ts:546](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L546)

Get filter graph description.

Returns human-readable graph structure.
Useful for debugging filter chains.

Direct mapping to avfilter_graph_dump().

#### Returns

`null` \| `string`

Graph description or null if not initialized

#### Example

```typescript
const description = filter.getGraphDescription();
console.log('Filter graph:', description);
```

***

### getMediaType()

> **getMediaType**(): `AVMediaType`

Defined in: [filter.ts:581](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L581)

Get media type of filter.

#### Returns

`AVMediaType`

AVMEDIA_TYPE_VIDEO or AVMEDIA_TYPE_AUDIO

#### Example

```typescript
if (filter.getMediaType() === AVMEDIA_TYPE_VIDEO) {
  console.log('Video filter');
}
```

***

### isReady()

> **isReady**(): `boolean`

Defined in: [filter.ts:565](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L565)

Check if filter is ready for processing.

#### Returns

`boolean`

true if initialized and ready

#### Example

```typescript
if (filter.isReady()) {
  const output = await filter.process(frame);
}
```

***

### process()

> **process**(`frame`): `Promise`\<`null` \| `Frame`\>

Defined in: [filter.ts:196](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L196)

Process a frame through the filter.

Applies filter operations to input frame.
May buffer frames internally before producing output.
For video, performs lazy initialization on first frame.

Direct mapping to av_buffersrc_add_frame() and av_buffersink_get_frame().

#### Parameters

##### frame

`Frame`

Input frame to process

#### Returns

`Promise`\<`null` \| `Frame`\>

Filtered frame or null if buffered

#### Throws

If filter not ready

#### Throws

If processing fails

#### Examples

```typescript
const output = await filter.process(inputFrame);
if (output) {
  console.log(`Got filtered frame: pts=${output.pts}`);
  output.free();
}
```

```typescript
// Process and drain
const output = await filter.process(frame);
if (output) yield output;

// Drain buffered frames
let buffered;
while ((buffered = await filter.receive()) !== null) {
  yield buffered;
}
```

#### See

 - [receive](#receive) For draining buffered frames
 - [frames](#frames) For stream processing

***

### processMultiple()

> **processMultiple**(`frames`): `Promise`\<`Frame`[]\>

Defined in: [filter.ts:252](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L252)

Process multiple frames at once.

Processes batch of frames and drains all output.
Useful for filters that buffer multiple frames.

#### Parameters

##### frames

`Frame`[]

Array of input frames

#### Returns

`Promise`\<`Frame`[]\>

Array of all output frames

#### Throws

If filter not ready

#### Throws

If processing fails

#### Example

```typescript
const outputs = await filter.processMultiple([frame1, frame2, frame3]);
for (const output of outputs) {
  console.log(`Output frame: pts=${output.pts}`);
  output.free();
}
```

#### See

[process](#process) For single frame processing

***

### queueCommand()

> **queueCommand**(`target`, `cmd`, `arg`, `ts`, `flags?`): `void`

Defined in: [filter.ts:521](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L521)

Queue command for later execution.

Schedules command to execute at specific timestamp.
Useful for synchronized parameter changes.

Direct mapping to avfilter_graph_queue_command().

#### Parameters

##### target

`string`

Target filter name

##### cmd

`string`

Command name

##### arg

`string`

Command argument

##### ts

`number`

Timestamp for execution

##### flags?

`AVFilterCmdFlag`

Command flags

#### Returns

`void`

#### Throws

If filter not ready

#### Throws

If queue fails

#### Example

```typescript
// Queue volume change at 10 seconds
filter.queueCommand('volume', 'volume', '0.8', 10.0);
```

#### See

[sendCommand](#sendcommand) For immediate commands

***

### receive()

> **receive**(): `Promise`\<`null` \| `Frame`\>

Defined in: [filter.ts:298](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L298)

Receive buffered frame from filter.

Drains frames buffered by the filter.
Call repeatedly until null to get all buffered frames.

Direct mapping to av_buffersink_get_frame().

#### Returns

`Promise`\<`null` \| `Frame`\>

Buffered frame or null if none available

#### Throws

If filter not ready

#### Throws

If receive fails

#### Example

```typescript
// Drain buffered frames
let frame;
while ((frame = await filter.receive()) !== null) {
  console.log(`Buffered frame: pts=${frame.pts}`);
  frame.free();
}
```

#### See

 - [process](#process) For input processing
 - [flush](#flush) For end-of-stream

***

### sendCommand()

> **sendCommand**(`target`, `cmd`, `arg`, `flags?`): `string`

Defined in: [filter.ts:483](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L483)

Send command to filter.

Sends runtime command to specific filter in graph.
Allows dynamic parameter adjustment.

Direct mapping to avfilter_graph_send_command().

#### Parameters

##### target

`string`

Target filter name

##### cmd

`string`

Command name

##### arg

`string`

Command argument

##### flags?

`AVFilterCmdFlag`

Command flags

#### Returns

`string`

Response string from filter

#### Throws

If filter not ready

#### Throws

If command fails

#### Example

```typescript
// Change volume at runtime
const response = filter.sendCommand('volume', 'volume', '0.5');
console.log(`Volume changed: ${response}`);
```

#### See

[queueCommand](#queuecommand) For delayed commands

***

### create()

> `static` **create**(`description`, `input`, `options`): `Promise`\<`FilterAPI`\>

Defined in: [filter.ts:116](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter.ts#L116)

Create a filter with specified description and configuration.

Constructs filter graph from description string.
Configures input/output buffers and threading.
For video filters, uses lazy initialization to detect hardware frames.

Direct mapping to avfilter_graph_parse_ptr() and avfilter_graph_config().

#### Parameters

##### description

`string`

Filter graph description

##### input

[`StreamInfo`](../type-aliases/StreamInfo.md)

Input stream configuration

##### options

[`FilterOptions`](../interfaces/FilterOptions.md) = `{}`

Filter options

#### Returns

`Promise`\<`FilterAPI`\>

Configured filter instance

#### Throws

If filter creation or configuration fails

#### Throws

If graph parsing or config fails

#### Examples

```typescript
// Simple video filter
const filter = await FilterAPI.create('scale=640:480', videoInfo);
```

```typescript
// Complex filter chain
const filter = await FilterAPI.create(
  'crop=640:480:0:0,rotate=PI/4',
  videoInfo
);
```

```typescript
// Audio filter
const filter = await FilterAPI.create(
  'volume=0.5,aecho=0.8:0.9:1000:0.3',
  audioInfo
);
```

#### See

 - [process](#process) For frame processing
 - [FilterOptions](../interfaces/FilterOptions.md) For configuration options
