[node-av](../globals.md) / PipelineControl

# Interface: PipelineControl

Defined in: [pipeline.ts:55](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L55)

Pipeline control interface for managing pipeline execution.
Allows graceful stopping and completion tracking of running pipelines.

## Example

```typescript
const control = pipeline(input, decoder, encoder, output);

// Stop after 10 seconds
setTimeout(() => control.stop(), 10000);

// Wait for completion
await control.completion;
```

## Properties

### completion

> `readonly` **completion**: `Promise`\<`void`\>

Defined in: [pipeline.ts:73](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L73)

Promise that resolves when the pipeline completes.
Resolves when all processing is finished or the pipeline is stopped.

## Methods

### isStopped()

> **isStopped**(): `boolean`

Defined in: [pipeline.ts:67](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L67)

Check if the pipeline has been stopped.

#### Returns

`boolean`

True if stop() has been called

***

### stop()

> **stop**(): `void`

Defined in: [pipeline.ts:60](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/pipeline.ts#L60)

Stop the pipeline gracefully.
The pipeline will stop processing after the current operation completes.

#### Returns

`void`
