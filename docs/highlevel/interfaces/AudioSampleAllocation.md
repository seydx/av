[node-av](../globals.md) / AudioSampleAllocation

# Interface: AudioSampleAllocation

Defined in: [utilities/audio-sample.ts:18](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/audio-sample.ts#L18)

Audio sample allocation result.

## Properties

### data

> **data**: `Buffer`\<`ArrayBufferLike`\>[]

Defined in: [utilities/audio-sample.ts:20](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/audio-sample.ts#L20)

Allocated data buffers (one per channel for planar formats)

***

### linesize

> **linesize**: `number`

Defined in: [utilities/audio-sample.ts:22](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/audio-sample.ts#L22)

Line size (bytes per channel)

***

### size

> **size**: `number`

Defined in: [utilities/audio-sample.ts:24](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/audio-sample.ts#L24)

Total allocated size
