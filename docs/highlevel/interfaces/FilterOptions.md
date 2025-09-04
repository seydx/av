[node-av](../globals.md) / FilterOptions

# Interface: FilterOptions

Defined in: [types.ts:238](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L238)

Options for creating a filter instance.

Configuration for filter graph initialization and hardware acceleration.

## Properties

### hardware?

> `optional` **hardware**: `null` \| [`HardwareContext`](../classes/HardwareContext.md)

Defined in: [types.ts:252](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L252)

Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal)

***

### scaleSwsOpts?

> `optional` **scaleSwsOpts**: `string`

Defined in: [types.ts:249](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L249)

Software scaler options (for video filters).
Example: "flags=bicubic"

***

### threads?

> `optional` **threads**: `number`

Defined in: [types.ts:243](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L243)

Number of threads for parallel processing.
0 = auto-detect based on CPU cores.
