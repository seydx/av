[node-av](../globals.md) / MediaInputOptions

# Interface: MediaInputOptions

Defined in: [types.ts:121](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L121)

Options for MediaInput opening.

Configures how media files are opened and packets are read.
Supports format detection, buffering, and FFmpeg options.

## Properties

### bufferSize?

> `optional` **bufferSize**: `number`

Defined in: [types.ts:132](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L132)

Buffer size for reading/writing operations.

This option allows you to specify the buffer size used for I/O operations.
A larger buffer size may improve performance by reducing the number of I/O calls,
while a smaller buffer size may reduce memory usage.

#### Default

```ts
8192
```

***

### format?

> `optional` **format**: `string`

Defined in: [types.ts:141](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L141)

Force specific input format.

Use this to specify the input format explicitly instead of auto-detection.
Useful for raw formats like 'rawvideo', 'rawaudio', etc.

***

### options?

> `optional` **options**: `Record`\<`string`, `string` \| `number`\>

Defined in: [types.ts:148](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L148)

FFmpeg format options passed directly to the input.
These are equivalent to options specified before -i in ffmpeg CLI.
