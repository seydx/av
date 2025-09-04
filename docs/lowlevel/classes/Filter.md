[node-av](../globals.md) / Filter

# Class: Filter

Defined in: [src/lib/filter.ts:40](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L40)

Filter descriptor for video/audio processing.

Represents a filter that can be used in filter graphs for processing
audio and video frames. Filters can be sources (no inputs), sinks (no outputs),
or processors (with both inputs and outputs). Each filter has specific
capabilities and pad configurations.

Direct mapping to FFmpeg's AVFilter.

## Example

```typescript
import { Filter } from 'node-av';

// Get a specific filter
const scaleFilter = Filter.getByName('scale');
if (scaleFilter) {
  console.log(`Filter: ${scaleFilter.name}`);
  console.log(`Description: ${scaleFilter.description}`);
  console.log(`Inputs: ${scaleFilter.inputs.length}`);
  console.log(`Outputs: ${scaleFilter.outputs.length}`);
}

// List all video filters
const filters = Filter.getList();
const videoFilters = filters.filter(f => f.isVideo());
console.log(`Found ${videoFilters.length} video filters`);
```

## See

 - \[AVFilter\](https://ffmpeg.org/doxygen/trunk/structAVFilter.html)
 - [FilterContext](FilterContext.md) For using filters in graphs
 - [FilterGraph](FilterGraph.md) For building filter pipelines

## Implements

- `NativeWrapper`\<`NativeFilter`\>

## Constructors

### Constructor

> **new Filter**(`native`): `Filter`

Defined in: [src/lib/filter.ts:47](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L47)

**`Internal`**

#### Parameters

##### native

`NativeFilter`

The native filter instance

#### Returns

`Filter`

## Accessors

### description

#### Get Signature

> **get** **description**(): `null` \| `string`

Defined in: [src/lib/filter.ts:129](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L129)

Filter description.

Human-readable description of what the filter does.

Direct mapping to AVFilter->description.

##### Returns

`null` \| `string`

***

### flags

#### Get Signature

> **get** **flags**(): `number`

Defined in: [src/lib/filter.ts:164](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L164)

Filter flags.

Combination of AVFILTER_FLAG_* values indicating filter capabilities.

Direct mapping to AVFilter->flags.

##### Returns

`number`

***

### inputs

#### Get Signature

> **get** **inputs**(): [`FilterPad`](../interfaces/FilterPad.md)[]

Defined in: [src/lib/filter.ts:141](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L141)

Input pads.

Array of input pad descriptors.
Empty array for source filters.

Direct mapping to AVFilter->inputs.

##### Returns

[`FilterPad`](../interfaces/FilterPad.md)[]

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/filter.ts:118](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L118)

Filter name.

Unique identifier for the filter (e.g., 'scale', 'overlay').

Direct mapping to AVFilter->name.

##### Returns

`null` \| `string`

***

### outputs

#### Get Signature

> **get** **outputs**(): [`FilterPad`](../interfaces/FilterPad.md)[]

Defined in: [src/lib/filter.ts:153](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L153)

Output pads.

Array of output pad descriptors.
Empty array for sink filters.

Direct mapping to AVFilter->outputs.

##### Returns

[`FilterPad`](../interfaces/FilterPad.md)[]

## Methods

### getNative()

> **getNative**(): `NativeFilter`

Defined in: [src/lib/filter.ts:255](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L255)

**`Internal`**

Get the underlying native Filter object.

#### Returns

`NativeFilter`

The native Filter binding object

#### Implementation of

`NativeWrapper.getNative`

***

### isAudio()

> **isAudio**(): `boolean`

Defined in: [src/lib/filter.ts:244](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L244)

Check if filter processes audio.

#### Returns

`boolean`

True if filter has audio inputs or outputs

#### Example

```typescript
const filters = Filter.getList();
const audioFilters = filters.filter(f => f.isAudio());
console.log(`Audio filters: ${audioFilters.length}`);
```

#### See

[isVideo](#isvideo) To check for video filters

***

### isSink()

> **isSink**(): `boolean`

Defined in: [src/lib/filter.ts:208](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L208)

Check if filter is a sink.

Sink filters consume frames without output
(e.g., 'nullsink', 'buffersink').

#### Returns

`boolean`

True if filter has no outputs

#### Example

```typescript
const filter = Filter.getByName('nullsink');
if (filter?.isSink()) {
  console.log('This is a sink filter');
}
```

#### See

[isSource](#issource) To check for source filters

***

### isSource()

> **isSource**(): `boolean`

Defined in: [src/lib/filter.ts:186](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L186)

Check if filter is a source.

Source filters generate frames without input
(e.g., 'testsrc', 'color', 'anullsrc').

#### Returns

`boolean`

True if filter has no inputs

#### Example

```typescript
const filter = Filter.getByName('testsrc');
if (filter?.isSource()) {
  console.log('This is a source filter');
}
```

#### See

[isSink](#issink) To check for sink filters

***

### isVideo()

> **isVideo**(): `boolean`

Defined in: [src/lib/filter.ts:226](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L226)

Check if filter processes video.

#### Returns

`boolean`

True if filter has video inputs or outputs

#### Example

```typescript
const filters = Filter.getList();
const videoFilters = filters.filter(f => f.isVideo());
console.log(`Video filters: ${videoFilters.length}`);
```

#### See

[isAudio](#isaudio) To check for audio filters

***

### getByName()

> `static` **getByName**(`name`): `null` \| `Filter`

Defined in: [src/lib/filter.ts:76](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L76)

Get a filter by name.

Retrieves a specific filter descriptor by its name.
Common filter names include 'scale', 'crop', 'overlay', 'aformat', etc.

Direct mapping to avfilter_get_by_name().

#### Parameters

##### name

`string`

Name of the filter

#### Returns

`null` \| `Filter`

Filter instance if found, null otherwise

#### Example

```typescript
// Get video scaling filter
const scale = Filter.getByName('scale');
if (!scale) {
  throw new Error('Scale filter not available');
}

// Get audio format filter
const aformat = Filter.getByName('aformat');
```

#### See

[getList](#getlist) To list all available filters

***

### getList()

> `static` **getList**(): `Filter`[]

Defined in: [src/lib/filter.ts:106](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter.ts#L106)

Get list of all available filters.

Returns an array of all registered filters in FFmpeg.
Useful for discovering available filters or building filter lists.

#### Returns

`Filter`[]

Array of all available filters

#### Example

```typescript
// List all filters
const filters = Filter.getList();
console.log(`Total filters: ${filters.length}`);

// Find all source filters (generators)
const sources = filters.filter(f => f.isSource());
console.log(`Source filters: ${sources.length}`);

// Find all sink filters (outputs)
const sinks = filters.filter(f => f.isSink());
console.log(`Sink filters: ${sinks.length}`);
```

#### See

[getByName](#getbyname) To get a specific filter
