[node-av](../globals.md) / IOStream

# Class: IOStream

Defined in: [io-stream.ts:47](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/io-stream.ts#L47)

Factory for creating custom I/O contexts.

Provides simplified creation of I/O contexts from buffers or custom callbacks.
Handles buffer management and seek operations for in-memory media.
Bridges the gap between high-level media operations and custom I/O sources.
Essential for processing media from non-file sources like network streams or memory.

## Examples

```typescript
import { IOStream, MediaInput } from '@seydx/av/api';

// From buffer
const buffer = await fs.readFile('video.mp4');
const ioContext = IOStream.create(buffer);
const input = await MediaInput.open(buffer);
```

```typescript
// Custom I/O callbacks
const callbacks = {
  read: async (size: number) => {
    // Read from custom source
    return Buffer.alloc(size);
  },
  seek: async (offset: bigint, whence: number) => {
    // Seek in custom source
    return offset;
  }
};

const ioContext = IOStream.create(callbacks, {
  bufferSize: 4096
});
```

## See

 - IOContext For low-level I/O operations
 - [MediaInput](MediaInput.md) For using I/O contexts
 - [IOInputCallbacks](../interfaces/IOInputCallbacks.md) For callback interface

## Constructors

### Constructor

> **new IOStream**(): `IOStream`

#### Returns

`IOStream`

## Methods

### create()

#### Call Signature

> `static` **create**(`buffer`, `options?`): `IOContext`

Defined in: [io-stream.ts:89](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/io-stream.ts#L89)

Create I/O context from buffer or callbacks.

Factory method that creates appropriate I/O context based on input type.
Supports both in-memory buffers and custom callback-based I/O.
Configures buffer size and read/seek operations.

Direct mapping to avio_alloc_context().

##### Parameters

###### buffer

`Buffer`

###### options?

[`MediaInputOptions`](../interfaces/MediaInputOptions.md)

I/O configuration options

##### Returns

`IOContext`

Configured I/O context

##### Throws

If input type is invalid

##### Throws

If callbacks missing required read function

##### Examples

```typescript
// From buffer
const buffer = await fs.readFile('video.mp4');
const ioContext = IOStream.create(buffer, {
  bufferSize: 8192
});
```

```typescript
// From callbacks
const ioContext = IOStream.create({
  read: async (size) => {
    return await customSource.read(size);
  },
  seek: async (offset, whence) => {
    return await customSource.seek(offset, whence);
  }
});
```

##### See

 - createFromBuffer For buffer implementation
 - createFromCallbacks For callback implementation

#### Call Signature

> `static` **create**(`callbacks`, `options?`): `IOContext`

Defined in: [io-stream.ts:90](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/io-stream.ts#L90)

Create I/O context from buffer or callbacks.

Factory method that creates appropriate I/O context based on input type.
Supports both in-memory buffers and custom callback-based I/O.
Configures buffer size and read/seek operations.

Direct mapping to avio_alloc_context().

##### Parameters

###### callbacks

[`IOInputCallbacks`](../interfaces/IOInputCallbacks.md)

###### options?

[`MediaInputOptions`](../interfaces/MediaInputOptions.md)

I/O configuration options

##### Returns

`IOContext`

Configured I/O context

##### Throws

If input type is invalid

##### Throws

If callbacks missing required read function

##### Examples

```typescript
// From buffer
const buffer = await fs.readFile('video.mp4');
const ioContext = IOStream.create(buffer, {
  bufferSize: 8192
});
```

```typescript
// From callbacks
const ioContext = IOStream.create({
  read: async (size) => {
    return await customSource.read(size);
  },
  seek: async (offset, whence) => {
    return await customSource.seek(offset, whence);
  }
});
```

##### See

 - createFromBuffer For buffer implementation
 - createFromCallbacks For callback implementation
