[node-av](../globals.md) / IOInputCallbacks

# Interface: IOInputCallbacks

Defined in: [types.ts:281](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L281)

Custom I/O callbacks for implementing custom input sources.

Defines callback functions for custom read operations with FFmpeg.
Used by IOStream.create() for custom input protocols.

## Properties

### read()

> **read**: (`size`) => `null` \| `number` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [types.ts:287](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L287)

Read callback - called when FFmpeg needs to read data.

#### Parameters

##### size

`number`

Number of bytes to read

#### Returns

`null` \| `number` \| `Buffer`\<`ArrayBufferLike`\>

Buffer with data, null for EOF, or negative error code

***

### seek()?

> `optional` **seek**: (`offset`, `whence`) => `number` \| `bigint`

Defined in: [types.ts:295](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L295)

Seek callback - called when FFmpeg needs to seek in the stream.

#### Parameters

##### offset

`bigint`

Offset to seek to

##### whence

`number`

Seek origin (AVSEEK_SET, AVSEEK_CUR, AVSEEK_END, or AVSEEK_SIZE)

#### Returns

`number` \| `bigint`

New position or negative error code
