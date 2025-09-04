[node-av](../globals.md) / pipeline

# Function: pipeline()

Pipeline implementation.

Creates a processing pipeline from media components.
Automatically handles type conversions and proper flushing order.

## Param

Variable arguments depending on pipeline type

## Example

```typescript
// Simple pipeline
const control = pipeline(
  input,
  decoder,
  filter,
  encoder,
  output
);
await control.completion;

// Named pipeline for muxing
const control = pipeline(
  { video: videoInput, audio: audioInput },
  {
    video: [videoDecoder, scaleFilter, videoEncoder],
    audio: [audioDecoder, volumeFilter, audioEncoder]
  },
  output
);
await control.completion;
```

## Call Signature

> **pipeline**(`source`, `decoder`, `encoder`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:95](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L95)

Full transcoding pipeline: input → decoder → encoder → output.

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets to frames

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames to packets

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

### Example

```typescript
const control = pipeline(input, decoder, encoder, output);
await control.completion;
```

## Call Signature

> **pipeline**(`source`, `decoder`, `filter`, `encoder`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:113](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L113)

Full transcoding pipeline with filter: input → decoder → filter → encoder → output.

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets to frames

#### filter

Filter or filter chain for processing frames

[`FilterAPI`](../classes/FilterAPI.md) | [`FilterAPI`](../classes/FilterAPI.md)[]

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames to packets

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

### Example

```typescript
const control = pipeline(input, decoder, scaleFilter, encoder, output);
await control.completion;
```

## Call Signature

> **pipeline**(`source`, `decoder`, `encoder`, `bsf`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:125](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L125)

Transcoding with bitstream filter: input → decoder → encoder → bsf → output.

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

#### bsf

Bitstream filter for packet processing

[`BitStreamFilterAPI`](../classes/BitStreamFilterAPI.md) | [`BitStreamFilterAPI`](../classes/BitStreamFilterAPI.md)[]

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**(`source`, `decoder`, `filter`, `encoder`, `bsf`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:138](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L138)

Full pipeline with filter and bsf: input → decoder → filter → encoder → bsf → output.

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets

#### filter

Filter or filter chain

[`FilterAPI`](../classes/FilterAPI.md) | [`FilterAPI`](../classes/FilterAPI.md)[]

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

#### bsf

Bitstream filter

[`BitStreamFilterAPI`](../classes/BitStreamFilterAPI.md) | [`BitStreamFilterAPI`](../classes/BitStreamFilterAPI.md)[]

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**(`source`, `decoder`, `filter1`, `filter2`, `encoder`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:158](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L158)

Decode + multiple filters + encode: input → decoder → filter1 → filter2 → encoder → output.

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets

#### filter1

[`FilterAPI`](../classes/FilterAPI.md)

First filter

#### filter2

[`FilterAPI`](../classes/FilterAPI.md)

Second filter

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**(`source`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:174](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L174)

Stream copy pipeline: input → output (copies all streams).

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

### Example

```typescript
// Copy all streams without re-encoding
const control = pipeline(input, output);
await control.completion;
```

## Call Signature

> **pipeline**(`source`, `bsf`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:184](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L184)

Stream copy with bitstream filter: input → bsf → output.

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### bsf

Bitstream filter for packet processing

[`BitStreamFilterAPI`](../classes/BitStreamFilterAPI.md) | [`BitStreamFilterAPI`](../classes/BitStreamFilterAPI.md)[]

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**(`source`, `filter`, `encoder`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:195](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L195)

Filter + encode + output: frames → filter → encoder → output.

### Parameters

#### source

`AsyncIterable`\<`Frame`\>

Frame source (async iterable)

#### filter

Filter or filter chain

[`FilterAPI`](../classes/FilterAPI.md) | [`FilterAPI`](../classes/FilterAPI.md)[]

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**(`source`, `encoder`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:205](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L205)

Encode + output: frames → encoder → output.

### Parameters

#### source

`AsyncIterable`\<`Frame`\>

Frame source (async iterable)

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Media output destination

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**(`source`, `decoder`): `AsyncGenerator`\<`Frame`\>

Defined in: [pipeline.ts:214](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L214)

Partial pipeline: input → decoder (returns frames).

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets

### Returns

`AsyncGenerator`\<`Frame`\>

Async generator of frames

## Call Signature

> **pipeline**(`source`, `decoder`, `filter`): `AsyncGenerator`\<`Frame`\>

Defined in: [pipeline.ts:224](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L224)

Partial pipeline: input → decoder → filter (returns frames).

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets

#### filter

Filter or filter chain

[`FilterAPI`](../classes/FilterAPI.md) | [`FilterAPI`](../classes/FilterAPI.md)[]

### Returns

`AsyncGenerator`\<`Frame`\>

Async generator of frames

## Call Signature

> **pipeline**(`source`, `decoder`, `filter`, `encoder`): `AsyncGenerator`\<`Packet`\>

Defined in: [pipeline.ts:235](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L235)

Partial pipeline: input → decoder → filter → encoder (returns packets).

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets

#### filter

Filter or filter chain

[`FilterAPI`](../classes/FilterAPI.md) | [`FilterAPI`](../classes/FilterAPI.md)[]

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

### Returns

`AsyncGenerator`\<`Packet`\>

Async generator of packets

## Call Signature

> **pipeline**(`source`, `decoder`, `encoder`): `AsyncGenerator`\<`Packet`\>

Defined in: [pipeline.ts:245](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L245)

Partial pipeline: input → decoder → encoder (returns packets).

### Parameters

#### source

[`MediaInput`](../classes/MediaInput.md)

Media input source

#### decoder

[`Decoder`](../classes/Decoder.md)

Decoder for decoding packets

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

### Returns

`AsyncGenerator`\<`Packet`\>

Async generator of packets

## Call Signature

> **pipeline**(`source`, `filter`): `AsyncGenerator`\<`Frame`\>

Defined in: [pipeline.ts:254](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L254)

Partial pipeline: frames → filter (returns frames).

### Parameters

#### source

`AsyncIterable`\<`Frame`\>

Frame source (async iterable)

#### filter

Filter or filter chain

[`FilterAPI`](../classes/FilterAPI.md) | [`FilterAPI`](../classes/FilterAPI.md)[]

### Returns

`AsyncGenerator`\<`Frame`\>

Async generator of filtered frames

## Call Signature

> **pipeline**(`source`, `encoder`): `AsyncGenerator`\<`Packet`\>

Defined in: [pipeline.ts:263](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L263)

Partial pipeline: frames → encoder (returns packets).

### Parameters

#### source

`AsyncIterable`\<`Frame`\>

Frame source (async iterable)

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

### Returns

`AsyncGenerator`\<`Packet`\>

Async generator of packets

## Call Signature

> **pipeline**(`source`, `filter`, `encoder`): `AsyncGenerator`\<`Packet`\>

Defined in: [pipeline.ts:273](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L273)

Partial pipeline: frames → filter → encoder (returns packets).

### Parameters

#### source

`AsyncIterable`\<`Frame`\>

Frame source (async iterable)

#### filter

Filter or filter chain

[`FilterAPI`](../classes/FilterAPI.md) | [`FilterAPI`](../classes/FilterAPI.md)[]

#### encoder

[`Encoder`](../classes/Encoder.md)

Encoder for encoding frames

### Returns

`AsyncGenerator`\<`Packet`\>

Async generator of packets

## Call Signature

> **pipeline**\<`K`\>(`inputs`, `stages`, `output`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:287](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L287)

Named pipeline with single output - all streams go to the same output.

### Type Parameters

#### K

`K` *extends* `StreamName`

### Parameters

#### inputs

`NamedInputs`\<`K`\>

Named input sources (video/audio)

#### stages

`NamedStages`\<`K`\>

Named processing stages for each stream

#### output

[`MediaOutput`](../classes/MediaOutput.md)

Single output destination for all streams

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**\<`K`\>(`inputs`, `stages`, `outputs`): [`PipelineControl`](../interfaces/PipelineControl.md)

Defined in: [pipeline.ts:297](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L297)

Named pipeline with multiple outputs - each stream has its own output.

### Type Parameters

#### K

`K` *extends* `StreamName`

### Parameters

#### inputs

`NamedInputs`\<`K`\>

Named input sources (video/audio)

#### stages

`NamedStages`\<`K`\>

Named processing stages for each stream

#### outputs

`NamedOutputs`\<`K`\>

Named output destinations

### Returns

[`PipelineControl`](../interfaces/PipelineControl.md)

Pipeline control for managing execution

## Call Signature

> **pipeline**\<`K`, `T`\>(`inputs`, `stages`): `Record`\<`K`, `AsyncGenerator`\<`T`\>\>

Defined in: [pipeline.ts:306](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L306)

Partial named pipeline (returns generators for further processing).

### Type Parameters

#### K

`K` *extends* `StreamName`

#### T

`T` *extends* `Frame` \| `Packet` = `Frame` \| `Packet`

### Parameters

#### inputs

`NamedInputs`\<`K`\>

Named input sources

#### stages

`NamedStages`\<`K`\>

Named processing stages

### Returns

`Record`\<`K`, `AsyncGenerator`\<`T`\>\>

Record of async generators for each stream
