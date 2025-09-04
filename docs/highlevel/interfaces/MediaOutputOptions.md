[node-av](../globals.md) / MediaOutputOptions

# Interface: MediaOutputOptions

Defined in: [types.ts:207](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L207)

Options for MediaOutput creation.

Configures output container format and buffering.

## Properties

### bufferSize?

> `optional` **bufferSize**: `number`

Defined in: [types.ts:229](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L229)

Buffer size for I/O operations.

This option controls the size of the internal buffer used for
reading and writing data. A larger buffer may improve performance
by reducing the number of I/O operations, but will also increase
memory usage.

#### Default

```ts
4096

```
```

***

### format?

> `optional` **format**: `string`

Defined in: [types.ts:215](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L215)

Preferred output format.

If not specified, format is guessed from file extension.
Use this to override automatic format detection.
