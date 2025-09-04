[node-av](../globals.md) / AudioInfo

# Interface: AudioInfo

Defined in: [types.ts:42](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L42)

Audio stream information.

Contains all necessary parameters to describe an audio stream.
Used for encoder and filter initialization.

## Properties

### channelLayout

> **channelLayout**: `ChannelLayout`

Defined in: [types.ts:53](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L53)

Channel layout configuration

***

### frameSize?

> `optional` **frameSize**: `number`

Defined in: [types.ts:59](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L59)

Number of samples per frame

***

### sampleFormat

> **sampleFormat**: `AVSampleFormat`

Defined in: [types.ts:50](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L50)

Sample format

***

### sampleRate

> **sampleRate**: `number`

Defined in: [types.ts:47](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L47)

Sample rate in Hz

***

### timeBase

> **timeBase**: `IRational`

Defined in: [types.ts:56](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L56)

Time base (required for timing)

***

### type

> **type**: `"audio"`

Defined in: [types.ts:44](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L44)

Discriminator for TypeScript type narrowing
