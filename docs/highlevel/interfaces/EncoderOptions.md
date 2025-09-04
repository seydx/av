[node-av](../globals.md) / EncoderOptions

# Interface: EncoderOptions

Defined in: [types.ts:176](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L176)

Options for encoder creation.

Encoder-specific configuration options.
Stream parameters (width, height, format, etc.) are taken from the provided stream.

## Properties

### bitrate?

> `optional` **bitrate**: `string` \| `number` \| `bigint`

Defined in: [types.ts:178](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L178)

Target bitrate (number, bigint, or string like '5M')

***

### gopSize?

> `optional` **gopSize**: `number`

Defined in: [types.ts:181](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L181)

Group of Pictures size

***

### hardware?

> `optional` **hardware**: `null` \| [`HardwareContext`](../classes/HardwareContext.md)

Defined in: [types.ts:199](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L199)

Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal)

***

### maxBFrames?

> `optional` **maxBFrames**: `number`

Defined in: [types.ts:184](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L184)

Max B-frames between non-B-frames

***

### options?

> `optional` **options**: `Record`\<`string`, `string` \| `number`\>

Defined in: [types.ts:196](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L196)

Additional codec-specific options (passed to AVOptions)

***

### threads?

> `optional` **threads**: `number`

Defined in: [types.ts:187](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L187)

Number of threads (0 for auto)

***

### timeBase?

> `optional` **timeBase**: `IRational`

Defined in: [types.ts:193](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L193)

Override output timebase (rational {num, den})
If not set, uses the stream's timebase
