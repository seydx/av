[node-av](../globals.md) / HardwareOptions

# Interface: HardwareOptions

Defined in: [types.ts:262](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L262)

Hardware acceleration configuration options.

Parameters for configuring hardware-accelerated encoding/decoding.
Supports device selection and initialization options.

## Properties

### device?

> `optional` **device**: `string`

Defined in: [types.ts:266](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L266)

Device path or index (e.g., '0' for first GPU).

***

### options?

> `optional` **options**: `Record`\<`string`, `string`\>

Defined in: [types.ts:271](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L271)

Device initialization options.
