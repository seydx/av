[node-av](../globals.md) / DecoderOptions

# Interface: DecoderOptions

Defined in: [types.ts:158](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L158)

Options for decoder creation.

Configuration parameters for initializing a media decoder.
Supports hardware acceleration and threading configuration.

## Properties

### hardware?

> `optional` **hardware**: `null` \| [`HardwareContext`](../classes/HardwareContext.md)

Defined in: [types.ts:166](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L166)

Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal)

***

### options?

> `optional` **options**: `Record`\<`string`, `string` \| `number`\>

Defined in: [types.ts:163](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L163)

Additional codec-specific options (passed to AVOptions)

***

### threads?

> `optional` **threads**: `number`

Defined in: [types.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L160)

Number of threads to use (0 for auto)
