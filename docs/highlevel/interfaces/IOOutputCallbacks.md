[node-av](../globals.md) / IOOutputCallbacks

# Interface: IOOutputCallbacks

Defined in: [types.ts:305](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L305)

Custom I/O callbacks for implementing custom output targets.

Defines callback functions for custom write operations with FFmpeg.
Used internally by MediaOutput for custom output protocols.

## Properties

### read()?

> `optional` **read**: (`size`) => `null` \| `number` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [types.ts:326](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L326)

Read callback - some formats may need to read back data.

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

Defined in: [types.ts:319](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L319)

Seek callback - called when FFmpeg needs to seek in the output.

#### Parameters

##### offset

`bigint`

Offset to seek to

##### whence

`number`

Seek origin (AVSEEK_SET, AVSEEK_CUR, AVSEEK_END)

#### Returns

`number` \| `bigint`

New position or negative error code

***

### write()

> **write**: (`buffer`) => `number` \| `void`

Defined in: [types.ts:311](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L311)

Write callback - called when FFmpeg needs to write data.

#### Parameters

##### buffer

`Buffer`

Buffer containing data to write

#### Returns

`number` \| `void`

Number of bytes written or void
