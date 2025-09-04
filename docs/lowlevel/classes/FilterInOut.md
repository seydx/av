[node-av](../globals.md) / FilterInOut

# Class: FilterInOut

Defined in: [src/lib/filter-inout.ts:42](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L42)

Filter input/output linked list structure for filter graph parsing.

Represents a linked list of labeled filter pads used during filter graph
configuration. Each node contains a filter context, pad index, and optional
label for connecting filters together. Used internally by avfilter_graph_parse()
to track unlinked filter pads during graph construction.

Direct mapping to FFmpeg's AVFilterInOut.

## Example

```typescript
import { FilterInOut, FilterContext, FFmpegError } from 'node-av';

// Create a linked list of filter inputs/outputs
const inputs = FilterInOut.createList([
  { name: 'in', filterCtx: bufferSrc, padIdx: 0 },
  { name: 'overlay', filterCtx: overlay, padIdx: 1 }
]);

// Parse filter graph with labeled connections
const ret = graph.parse(filterString, inputs, outputs);
FFmpegError.throwIfError(ret, 'parse');

// Manual creation and linking
const inout = new FilterInOut();
inout.alloc();
inout.name = 'input';
inout.filterCtx = sourceFilter;
inout.padIdx = 0;
```

## See

 - \[AVFilterInOut\](https://ffmpeg.org/doxygen/trunk/structAVFilterInOut.html)
 - [FilterGraph](FilterGraph.md) For parsing filter descriptions
 - [FilterContext](FilterContext.md) For filter instances

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeFilterInOut`\>

## Constructors

### Constructor

> **new FilterInOut**(): `FilterInOut`

Defined in: [src/lib/filter-inout.ts:45](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L45)

#### Returns

`FilterInOut`

## Accessors

### filterCtx

#### Get Signature

> **get** **filterCtx**(): `null` \| [`FilterContext`](FilterContext.md)

Defined in: [src/lib/filter-inout.ts:132](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L132)

Filter context this pad belongs to.

Reference to the filter instance containing this pad.

Direct mapping to AVFilterInOut->filter_ctx.

##### Returns

`null` \| [`FilterContext`](FilterContext.md)

#### Set Signature

> **set** **filterCtx**(`value`): `void`

Defined in: [src/lib/filter-inout.ts:137](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L137)

##### Parameters

###### value

`null` | [`FilterContext`](FilterContext.md)

##### Returns

`void`

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/filter-inout.ts:117](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L117)

Label name for this filter pad.

Used to reference this connection point in filter graph strings.
For example, "[in]" or "[video_out]".

Direct mapping to AVFilterInOut->name.

##### Returns

`null` \| `string`

#### Set Signature

> **set** **name**(`value`): `void`

Defined in: [src/lib/filter-inout.ts:121](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L121)

##### Parameters

###### value

`null` | `string`

##### Returns

`void`

***

### next

#### Get Signature

> **get** **next**(): `null` \| `FilterInOut`

Defined in: [src/lib/filter-inout.ts:164](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L164)

Next node in the linked list.

Reference to the next FilterInOut in the chain, or null for the last node.

Direct mapping to AVFilterInOut->next.

##### Returns

`null` \| `FilterInOut`

#### Set Signature

> **set** **next**(`value`): `void`

Defined in: [src/lib/filter-inout.ts:175](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L175)

##### Parameters

###### value

`null` | `FilterInOut`

##### Returns

`void`

***

### padIdx

#### Get Signature

> **get** **padIdx**(): `number`

Defined in: [src/lib/filter-inout.ts:149](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L149)

Pad index within the filter.

Index of the input or output pad in the filter context.
0 for the first pad, 1 for the second, etc.

Direct mapping to AVFilterInOut->pad_idx.

##### Returns

`number`

#### Set Signature

> **set** **padIdx**(`value`): `void`

Defined in: [src/lib/filter-inout.ts:153](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L153)

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/filter-inout.ts:284](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L284)

Dispose of the FilterInOut structure.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using inout = new FilterInOut();
  inout.alloc();
  inout.name = 'test';
  // Use inout...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(): `void`

Defined in: [src/lib/filter-inout.ts:201](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L201)

Allocate a FilterInOut structure.

Allocates memory for the structure. Must be called before using
a manually created instance.

Direct mapping to avfilter_inout_alloc().

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
const inout = new FilterInOut();
inout.alloc();
inout.name = 'input';
inout.filterCtx = bufferSource;
inout.padIdx = 0;
```

#### See

 - [free](#free) To deallocate
 - [createList](#createlist) For automatic allocation

***

### count()

> **count**(): `number`

Defined in: [src/lib/filter-inout.ts:245](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L245)

Count nodes in the linked list.

Counts the total number of nodes starting from this node
and following the next pointers.

#### Returns

`number`

Number of nodes in the list (including this one)

#### Example

```typescript
const list = FilterInOut.createList([
  { name: 'in1', filterCtx: filter1, padIdx: 0 },
  { name: 'in2', filterCtx: filter2, padIdx: 0 },
  { name: 'in3', filterCtx: filter3, padIdx: 0 }
]);

console.log(`List has ${list.count()} nodes`); // 3
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/filter-inout.ts:222](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L222)

Free the FilterInOut structure.

Deallocates the structure and breaks the chain if part of a linked list.
Only frees this node, not the entire list.

Direct mapping to avfilter_inout_free().

#### Returns

`void`

#### Example

```typescript
inout.free();
// Structure is now invalid
```

#### See

 - [alloc](#alloc) To allocate
 - Symbol.dispose For automatic cleanup

***

### getNative()

> **getNative**(): `NativeFilterInOut`

Defined in: [src/lib/filter-inout.ts:264](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L264)

**`Internal`**

Get the underlying native FilterInOut object.

#### Returns

`NativeFilterInOut`

The native FilterInOut binding object

#### Implementation of

`NativeWrapper.getNative`

***

### createList()

> `static` **createList**(`items`): `null` \| `FilterInOut`

Defined in: [src/lib/filter-inout.ts:78](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/filter-inout.ts#L78)

Create a linked list of filter inputs/outputs.

Convenience method to build a linked list structure from an array
of filter specifications. Each item becomes a node in the list.

#### Parameters

##### items

`object`[]

Array of filter input/output specifications

#### Returns

`null` \| `FilterInOut`

Head of the linked list, or null if items is empty

#### Example

```typescript
// Create inputs for a filter graph
const inputs = FilterInOut.createList([
  { name: 'video_in', filterCtx: videoBuffer, padIdx: 0 },
  { name: 'audio_in', filterCtx: audioBuffer, padIdx: 0 }
]);

// Create outputs
const outputs = FilterInOut.createList([
  { name: 'video_out', filterCtx: videoSink, padIdx: 0 },
  { name: 'audio_out', filterCtx: audioSink, padIdx: 0 }
]);
```

#### See

[alloc](#alloc) For manual node creation
