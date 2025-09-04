[node-av](../globals.md) / AudioRawData

# Interface: AudioRawData

Defined in: [types.ts:96](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L96)

Raw audio data configuration.

Specifies parameters for opening raw audio files like PCM.

## Properties

### channels

> **channels**: `number`

Defined in: [types.ts:107](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L107)

Number of audio channels

***

### input

> **input**: `string` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [types.ts:101](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L101)

Raw audio input source (file path, Buffer, or stream)

***

### sampleFormat

> **sampleFormat**: `AVSampleFormat`

Defined in: [types.ts:110](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L110)

Sample format (e.g., AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_S32)

***

### sampleRate

> **sampleRate**: `number`

Defined in: [types.ts:104](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L104)

Sample rate in Hz (e.g., 44100, 48000)

***

### type

> **type**: `"audio"`

Defined in: [types.ts:98](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L98)

Type discriminator for TypeScript
