[node-av](../globals.md) / PosixError

# Enumeration: PosixError

Defined in: [src/lib/error.ts:19](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L19)

POSIX error names that can be converted to FFmpeg error codes.
These are platform-specific and resolved at runtime.

## Example

```typescript
import { PosixError, FFmpegError } from 'node-av';

// Get platform-specific error code
const errorCode = FFmpegError.AVERROR(PosixError.EAGAIN);
console.log(`EAGAIN on this platform: ${errorCode}`);
```

## Enumeration Members

### EACCES

> **EACCES**: `"EACCES"`

Defined in: [src/lib/error.ts:27](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L27)

***

### EAGAIN

> **EAGAIN**: `"EAGAIN"`

Defined in: [src/lib/error.ts:20](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L20)

***

### EBUSY

> **EBUSY**: `"EBUSY"`

Defined in: [src/lib/error.ts:33](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L33)

***

### EEXIST

> **EEXIST**: `"EEXIST"`

Defined in: [src/lib/error.ts:29](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L29)

***

### EINVAL

> **EINVAL**: `"EINVAL"`

Defined in: [src/lib/error.ts:22](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L22)

***

### EIO

> **EIO**: `"EIO"`

Defined in: [src/lib/error.ts:23](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L23)

***

### EISDIR

> **EISDIR**: `"EISDIR"`

Defined in: [src/lib/error.ts:32](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L32)

***

### EMFILE

> **EMFILE**: `"EMFILE"`

Defined in: [src/lib/error.ts:34](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L34)

***

### ENODEV

> **ENODEV**: `"ENODEV"`

Defined in: [src/lib/error.ts:30](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L30)

***

### ENOENT

> **ENOENT**: `"ENOENT"`

Defined in: [src/lib/error.ts:26](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L26)

***

### ENOMEM

> **ENOMEM**: `"ENOMEM"`

Defined in: [src/lib/error.ts:21](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L21)

***

### ENOSPC

> **ENOSPC**: `"ENOSPC"`

Defined in: [src/lib/error.ts:25](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L25)

***

### ENOTDIR

> **ENOTDIR**: `"ENOTDIR"`

Defined in: [src/lib/error.ts:31](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L31)

***

### EPERM

> **EPERM**: `"EPERM"`

Defined in: [src/lib/error.ts:28](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L28)

***

### EPIPE

> **EPIPE**: `"EPIPE"`

Defined in: [src/lib/error.ts:24](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L24)

***

### ERANGE

> **ERANGE**: `"ERANGE"`

Defined in: [src/lib/error.ts:35](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/error.ts#L35)
