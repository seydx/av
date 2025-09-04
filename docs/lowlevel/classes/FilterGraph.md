[node-av](../globals.md) / FilterGraph

# Class: FilterGraph

Defined in: [src/lib/filter-graph.ts:64](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L64)

Filter graph for audio/video processing pipelines.

Manages a collection of interconnected filters forming a processing pipeline.
Filters are connected through their input/output pads to create complex
audio/video transformations. Supports both simple linear chains and complex
graphs with multiple inputs/outputs. Essential for effects, format conversions,
scaling, and other media processing operations.

Direct mapping to FFmpeg's AVFilterGraph.

## Example

```typescript
import { FilterGraph, Filter, FilterInOut, FFmpegError } from 'node-av';

// Create and configure filter graph
const graph = new FilterGraph();
graph.alloc();

// Create filters
const bufferSrc = graph.createFilter(
  Filter.getByName('buffer')!,
  'src',
  'video_size=1920x1080:pix_fmt=yuv420p'
);

const scale = graph.createFilter(
  Filter.getByName('scale')!,
  'scale',
  '640:480'
);

const bufferSink = graph.createFilter(
  Filter.getByName('buffersink')!,
  'sink'
);

// Link filters
bufferSrc.link(0, scale, 0);
scale.link(0, bufferSink, 0);

// Configure graph
const ret = await graph.config();
FFmpegError.throwIfError(ret, 'config');

// Parse filter string
const ret2 = graph.parse2('[in]scale=640:480[out]');
FFmpegError.throwIfError(ret2, 'parse2');
```

## See

 - \[AVFilterGraph\](https://ffmpeg.org/doxygen/trunk/structAVFilterGraph.html)
 - [FilterContext](FilterContext.md) For filter instances
 - [Filter](Filter.md) For filter descriptors

## Extends

- `OptionMember`\<`NativeFilterGraph`\>

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeFilterGraph`\>

## Constructors

### Constructor

> **new FilterGraph**(): `FilterGraph`

Defined in: [src/lib/filter-graph.ts:65](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L65)

#### Returns

`FilterGraph`

#### Overrides

`OptionMember<NativeFilterGraph>.constructor`

## Properties

### native

> `protected` **native**: `NativeFilterGraph`

Defined in: [src/lib/option.ts:733](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L733)

#### Inherited from

`OptionMember.native`

## Accessors

### filters

#### Get Signature

> **get** **filters**(): `null` \| [`FilterContext`](FilterContext.md)[]

Defined in: [src/lib/filter-graph.ts:87](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L87)

Array of filters in the graph.

All filter contexts currently in the graph.

Direct mapping to AVFilterGraph->filters.

##### Returns

`null` \| [`FilterContext`](FilterContext.md)[]

***

### nbFilters

#### Get Signature

> **get** **nbFilters**(): `number`

Defined in: [src/lib/filter-graph.ts:76](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L76)

Number of filters in the graph.

Total count of filter contexts in this graph.

Direct mapping to AVFilterGraph->nb_filters.

##### Returns

`number`

***

### nbThreads

#### Get Signature

> **get** **nbThreads**(): `number`

Defined in: [src/lib/filter-graph.ts:117](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L117)

Number of threads for parallel processing.

Number of threads used for filter execution.
0 means automatic detection.

Direct mapping to AVFilterGraph->nb_threads.

##### Returns

`number`

#### Set Signature

> **set** **nbThreads**(`value`): `void`

Defined in: [src/lib/filter-graph.ts:121](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L121)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### scaleSwsOpts

#### Get Signature

> **get** **scaleSwsOpts**(): `null` \| `string`

Defined in: [src/lib/filter-graph.ts:132](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L132)

Swscale options for scale filter.

Options string passed to swscale for scaling operations.

Direct mapping to AVFilterGraph->scale_sws_opts.

##### Returns

`null` \| `string`

#### Set Signature

> **set** **scaleSwsOpts**(`value`): `void`

Defined in: [src/lib/filter-graph.ts:136](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L136)

##### Parameters

###### value

`null` | `string`

##### Returns

`void`

***

### threadType

#### Get Signature

> **get** **threadType**(): `AVFilterConstants`

Defined in: [src/lib/filter-graph.ts:101](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L101)

Threading type for graph execution.

Controls how filters are executed in parallel.
Use AVFILTER_THREAD_SLICE for slice-based threading.

Direct mapping to AVFilterGraph->thread_type.

##### Returns

`AVFilterConstants`

#### Set Signature

> **set** **threadType**(`value`): `void`

Defined in: [src/lib/filter-graph.ts:105](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L105)

##### Parameters

###### value

`AVFilterConstants`

##### Returns

`void`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/filter-graph.ts:592](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L592)

Dispose of the filter graph.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using graph = new FilterGraph();
  graph.alloc();
  // Build and use graph...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(): `void`

Defined in: [src/lib/filter-graph.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L160)

Allocate a filter graph.

Allocates memory for the filter graph structure.
Must be called before using the graph.

Direct mapping to avfilter_graph_alloc().

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
const graph = new FilterGraph();
graph.alloc();
// Graph is now ready for filter creation
```

#### See

 - [free](#free) To deallocate
 - [config](#config) To configure after building

***

### allocFilter()

> **allocFilter**(`filter`, `name`): `null` \| [`FilterContext`](FilterContext.md)

Defined in: [src/lib/filter-graph.ts:252](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L252)

Allocate a filter in the graph.

Creates a new filter context and adds it to the graph,
but does not initialize it. Call init() on the context afterwards.

Direct mapping to avfilter_graph_alloc_filter().

#### Parameters

##### filter

[`Filter`](Filter.md)

Filter descriptor to instantiate

##### name

`string`

Name for this filter instance

#### Returns

`null` \| [`FilterContext`](FilterContext.md)

Allocated filter context, or null on failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const filter = graph.allocFilter(
  Filter.getByName('scale')!,
  'scaler'
);
if (filter) {
  // Initialize separately
  const ret = filter.initStr('640:480');
  FFmpegError.throwIfError(ret, 'initStr');
}
```

#### See

[createFilter](#createfilter) To allocate and initialize

***

### config()

> **config**(): `Promise`\<`number`\>

Defined in: [src/lib/filter-graph.ts:310](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L310)

Configure the filter graph.

Validates and finalizes the graph configuration.
Must be called after all filters are created and linked.

Direct mapping to avfilter_graph_config().

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid graph configuration
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Build graph...
// Link filters...

// Configure the complete graph
const ret = await graph.config();
FFmpegError.throwIfError(ret, 'config');
// Graph is now ready for processing
```

#### See

[validate](#validate) To check configuration

***

### createFilter()

> **createFilter**(`filter`, `name`, `args`): `null` \| [`FilterContext`](FilterContext.md)

Defined in: [src/lib/filter-graph.ts:218](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L218)

Create and initialize a filter in the graph.

Creates a new filter context, adds it to the graph,
and initializes it with the provided arguments.

Direct mapping to avfilter_graph_create_filter().

#### Parameters

##### filter

[`Filter`](Filter.md)

Filter descriptor to instantiate

##### name

`string`

Name for this filter instance

##### args

Initialization arguments (filter-specific)

`null` | `string`

#### Returns

`null` \| [`FilterContext`](FilterContext.md)

Created filter context, or null on failure

#### Example

```typescript
// Create a scale filter
const scale = graph.createFilter(
  Filter.getByName('scale')!,
  'scaler',
  '640:480'  // width:height
);

// Create a buffer source
const src = graph.createFilter(
  Filter.getByName('buffer')!,
  'source',
  'video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25'
);
```

#### See

 - [allocFilter](#allocfilter) To allocate without initializing
 - [getFilter](#getfilter) To retrieve by name

***

### dump()

> **dump**(): `null` \| `string`

Defined in: [src/lib/filter-graph.ts:489](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L489)

Dump the filter graph to a string.

Returns a textual representation of the graph structure.
Useful for debugging and visualization.

Direct mapping to avfilter_graph_dump().

#### Returns

`null` \| `string`

Graph description string, or null on failure

#### Example

```typescript
const graphStr = graph.dump();
if (graphStr) {
  console.log('Graph structure:');
  console.log(graphStr);
}
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/filter-graph.ts:181](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L181)

Free the filter graph.

Releases all resources associated with the graph,
including all contained filters.

Direct mapping to avfilter_graph_free().

#### Returns

`void`

#### Example

```typescript
graph.free();
// Graph is now invalid
```

#### See

 - [alloc](#alloc) To allocate
 - Symbol.dispose For automatic cleanup

***

### getFilter()

> **getFilter**(`name`): `null` \| [`FilterContext`](FilterContext.md)

Defined in: [src/lib/filter-graph.ts:278](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L278)

Get a filter by name from the graph.

Retrieves an existing filter context by its instance name.

Direct mapping to avfilter_graph_get_filter().

#### Parameters

##### name

`string`

Name of the filter instance

#### Returns

`null` \| [`FilterContext`](FilterContext.md)

Filter context if found, null otherwise

#### Example

```typescript
// Find a previously created filter
const scaler = graph.getFilter('scaler');
if (scaler) {
  console.log('Found scaler filter');
}
```

#### See

[createFilter](#createfilter) To create new filters

***

### getNative()

> **getNative**(): `NativeFilterGraph`

Defined in: [src/lib/filter-graph.ts:573](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L573)

**`Internal`**

Get the underlying native FilterGraph object.

#### Returns

`NativeFilterGraph`

The native FilterGraph binding object

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

### parse()

> **parse**(`filters`, `inputs`, `outputs`): `number`

Defined in: [src/lib/filter-graph.ts:351](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L351)

Parse a filter graph description.

Parses a textual representation of a filter graph and adds
filters to this graph. Handles labeled inputs and outputs.

Direct mapping to avfilter_graph_parse().

#### Parameters

##### filters

`string`

Filter graph description string

##### inputs

Linked list of graph inputs

`null` | [`FilterInOut`](FilterInOut.md)

##### outputs

Linked list of graph outputs

`null` | [`FilterInOut`](FilterInOut.md)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Parse error
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError, FilterInOut } from 'node-av';

const inputs = FilterInOut.createList([
  { name: 'in', filterCtx: bufferSrc, padIdx: 0 }
]);
const outputs = FilterInOut.createList([
  { name: 'out', filterCtx: bufferSink, padIdx: 0 }
]);

const ret = graph.parse(
  '[in]scale=640:480,format=yuv420p[out]',
  inputs,
  outputs
);
FFmpegError.throwIfError(ret, 'parse');
```

#### See

 - [parse2](#parse2) For simpler syntax
 - [parsePtr](#parseptr) For alternative parsing

***

### parse2()

> **parse2**(`filters`): `number`

Defined in: [src/lib/filter-graph.ts:381](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L381)

Parse a filter graph description (simplified).

Parses a textual filter description with automatic input/output handling.
Simpler than parse() but less flexible.

Direct mapping to avfilter_graph_parse2().

#### Parameters

##### filters

`string`

Filter graph description string

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Parse error
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Parse a simple filter chain
const ret = graph.parse2(
  'scale=640:480,format=yuv420p'
);
FFmpegError.throwIfError(ret, 'parse2');
```

#### See

[parse](#parse) For labeled inputs/outputs

***

### parsePtr()

> **parsePtr**(`filters`, `inputs?`, `outputs?`): `number`

Defined in: [src/lib/filter-graph.ts:412](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L412)

Parse a filter graph description with pointer.

Alternative parsing method with different parameter handling.

Direct mapping to avfilter_graph_parse_ptr().

#### Parameters

##### filters

`string`

Filter graph description string

##### inputs?

Optional linked list of inputs

`null` | [`FilterInOut`](FilterInOut.md)

##### outputs?

Optional linked list of outputs

`null` | [`FilterInOut`](FilterInOut.md)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Parse error
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = graph.parsePtr(
  '[in]scale=w=640:h=480[out]'
);
FFmpegError.throwIfError(ret, 'parsePtr');
```

#### See

 - [parse](#parse) For standard parsing
 - [parse2](#parse2) For simplified parsing

***

### queueCommand()

> **queueCommand**(`target`, `cmd`, `arg`, `ts`, `flags?`): `number`

Defined in: [src/lib/filter-graph.ts:562](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L562)

Queue a command for delayed execution.

Schedules a command to be executed at a specific timestamp.
The command is executed when the filter processes a frame with that timestamp.

Direct mapping to avfilter_graph_queue_command().

#### Parameters

##### target

`string`

Filter name or "all"

##### cmd

`string`

Command to queue

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

`number`

0 on success, negative AVERROR on error

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Queue volume change at 5 seconds
const ret = graph.queueCommand(
  'volume',
  'volume',
  '0.2',
  5000000,  // microseconds
  0
);
FFmpegError.throwIfError(ret, 'queueCommand');
```

#### See

[sendCommand](#sendcommand) For immediate execution

***

### requestOldest()

> **requestOldest**(): `Promise`\<`number`\>

Defined in: [src/lib/filter-graph.ts:466](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L466)

Request a frame from the oldest sink.

Requests that a frame be output from the oldest sink in the graph.
Used to drive the filter graph processing.

Direct mapping to avfilter_graph_request_oldest().

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EOF: End of stream reached
  - AVERROR_EAGAIN: Need more input

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AVERROR_EOF, AVERROR_EAGAIN } from 'node-av/constants';

const ret = await graph.requestOldest();
if (ret === AVERROR_EOF) {
  // No more frames
} else if (ret === AVERROR_EAGAIN) {
  // Need to provide more input
} else {
  FFmpegError.throwIfError(ret, 'requestOldest');
}
```

***

### sendCommand()

> **sendCommand**(`target`, `cmd`, `arg`, `flags?`): `number` \| \{ `response`: `null` \| `string`; \}

Defined in: [src/lib/filter-graph.ts:526](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L526)

Send a command to filters in the graph.

Sends a command to one or more filters for immediate execution.
Target can be a specific filter name or "all" for all filters.

Direct mapping to avfilter_graph_send_command().

#### Parameters

##### target

`string`

Filter name or "all"

##### cmd

`string`

Command to send

##### arg

`string`

Command argument

##### flags?

`AVFilterCmdFlag`

Command flags

#### Returns

`number` \| \{ `response`: `null` \| `string`; \}

Error code or response object

#### Example

```typescript
// Send command to specific filter
const result = graph.sendCommand(
  'volume',
  'volume',
  '0.5'
);

// Send to all filters
const result2 = graph.sendCommand(
  'all',
  'enable',
  'timeline'
);
```

#### See

[queueCommand](#queuecommand) For delayed execution

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

### validate()

> **validate**(): `number`

Defined in: [src/lib/filter-graph.ts:435](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-graph.ts#L435)

Validate the filter graph configuration.

Checks if the graph is valid and properly configured.
Does not finalize the graph like config() does.

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid configuration

#### Example

```typescript
import { FFmpegError } from 'node-av';

const ret = graph.validate();
FFmpegError.throwIfError(ret, 'validate');
```

#### See

[config](#config) To configure and finalize
