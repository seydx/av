[node-av](../globals.md) / HardwareDeviceContext

# Class: HardwareDeviceContext

Defined in: [src/lib/hardware-device-context.ts:51](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L51)

Hardware device context for GPU-accelerated processing.

Manages hardware acceleration devices for video encoding, decoding, and filtering.
Provides access to GPU resources like CUDA, VAAPI, VideoToolbox, and other
hardware acceleration APIs. Essential for high-performance video processing
and reduced CPU usage.

Direct mapping to FFmpeg's AVHWDeviceContext.

## Example

```typescript
import { HardwareDeviceContext, FFmpegError } from 'node-av';
import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VIDEOTOOLBOX } from 'node-av/constants';

// Create hardware device
const device = new HardwareDeviceContext();
const ret = device.create(AV_HWDEVICE_TYPE_CUDA);
FFmpegError.throwIfError(ret, 'create');

// List available hardware types
const types = HardwareDeviceContext.iterateTypes();
for (const type of types) {
  const name = HardwareDeviceContext.getTypeName(type);
  console.log(`Available: ${name}`);
}

// Use with decoder
const codecContext = new CodecContext();
codecContext.hwDeviceCtx = device;

// Create derived context
const derived = new HardwareDeviceContext();
const ret2 = derived.createDerived(device, AV_HWDEVICE_TYPE_CUDA);
FFmpegError.throwIfError(ret2, 'createDerived');

// Cleanup
device.free();
```

## See

 - \[AVHWDeviceContext\](https://ffmpeg.org/doxygen/trunk/structAVHWDeviceContext.html)
 - [HardwareFramesContext](HardwareFramesContext.md) For hardware frame allocation
 - [CodecContext](CodecContext.md) For hardware codec usage

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeHardwareDeviceContext`\>

## Constructors

### Constructor

> **new HardwareDeviceContext**(): `HardwareDeviceContext`

Defined in: [src/lib/hardware-device-context.ts:54](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L54)

#### Returns

`HardwareDeviceContext`

## Accessors

### hwctx

#### Get Signature

> **get** **hwctx**(): `null` \| `bigint`

Defined in: [src/lib/hardware-device-context.ts:149](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L149)

Hardware context pointer.

Opaque pointer to the underlying hardware-specific context.
Type depends on the hardware device type.

Direct mapping to AVHWDeviceContext->hwctx.

##### Returns

`null` \| `bigint`

***

### type

#### Get Signature

> **get** **type**(): `AVHWDeviceType`

Defined in: [src/lib/hardware-device-context.ts:137](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L137)

Hardware device type.

The type of hardware acceleration in use.

Direct mapping to AVHWDeviceContext->type.

##### Returns

`AVHWDeviceType`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/hardware-device-context.ts:398](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L398)

Dispose of the hardware device context.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using device = new HardwareDeviceContext();
  device.create(AV_HWDEVICE_TYPE_CUDA);
  // Use device...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(`type`): `void`

Defined in: [src/lib/hardware-device-context.ts:178](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L178)

Allocate hardware device context.

Allocates memory for the specified hardware device type.
Must be followed by init() to initialize the device.

Direct mapping to av_hwdevice_ctx_alloc().

#### Parameters

##### type

`AVHWDeviceType`

Hardware device type to allocate

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';

const device = new HardwareDeviceContext();
device.alloc(AV_HWDEVICE_TYPE_CUDA);
const ret = device.init();
FFmpegError.throwIfError(ret, 'init');
```

#### See

 - [init](#init) To initialize after allocation
 - [create](#create) For combined alloc and init

***

### create()

> **create**(`type`, `device`, `options`): `number`

Defined in: [src/lib/hardware-device-context.ts:251](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L251)

Create and initialize hardware device.

Combined allocation and initialization of a hardware device.
This is the preferred method for creating hardware contexts.

Direct mapping to av_hwdevice_ctx_create().

#### Parameters

##### type

`AVHWDeviceType`

Hardware device type

##### device

Device name/path (null for default)

`null` | `string`

##### options

Device-specific options

`null` | [`Dictionary`](Dictionary.md)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid type or parameters
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_ENOSYS: Type not supported
  - Device-specific errors

#### Example

```typescript
import { FFmpegError, Dictionary } from 'node-av';
import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';

// Create with default device
const device = new HardwareDeviceContext();
let ret = device.create(AV_HWDEVICE_TYPE_CUDA);
FFmpegError.throwIfError(ret, 'create');

// Create with specific device
const device2 = new HardwareDeviceContext();
ret = device2.create(AV_HWDEVICE_TYPE_VAAPI, '/dev/dri/renderD128');
FFmpegError.throwIfError(ret, 'create');

// Create with options
const opts = Dictionary.fromObject({ 'device_idx': '1' });
ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, opts);
FFmpegError.throwIfError(ret, 'create');
```

#### See

[createDerived](#createderived) To create from existing device

***

### createDerived()

> **createDerived**(`source`, `type`): `number`

Defined in: [src/lib/hardware-device-context.ts:286](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L286)

Create derived hardware device.

Creates a new device context derived from an existing one.
Used for interoperability between different hardware APIs.

Direct mapping to av_hwdevice_ctx_create_derived().

#### Parameters

##### source

`HardwareDeviceContext`

Source device context to derive from

##### type

`AVHWDeviceType`

Target hardware device type

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOSYS: Derivation not supported
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VULKAN } from 'node-av/constants';

// Create CUDA device from Vulkan
const vulkan = new HardwareDeviceContext();
vulkan.create(AV_HWDEVICE_TYPE_VULKAN);

const cuda = new HardwareDeviceContext();
const ret = cuda.createDerived(vulkan, AV_HWDEVICE_TYPE_CUDA);
FFmpegError.throwIfError(ret, 'createDerived');
```

#### See

[create](#create) For creating independent device

***

### free()

> **free**(): `void`

Defined in: [src/lib/hardware-device-context.ts:306](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L306)

Free hardware device context.

Releases all resources associated with the hardware device.
The context becomes invalid after calling this.

Direct mapping to av_buffer_unref() on device context.

#### Returns

`void`

#### Example

```typescript
device.free();
// Device is now invalid
```

#### See

Symbol.dispose For automatic cleanup

***

### getHwframeConstraints()

> **getHwframeConstraints**(`hwconfig?`): `null` \| \{ `maxHeight`: `number`; `maxWidth`: `number`; `minHeight`: `number`; `minWidth`: `number`; `validHwFormats?`: `number`[]; `validSwFormats?`: `number`[]; \}

Defined in: [src/lib/hardware-device-context.ts:361](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L361)

Get hardware frame constraints.

Returns the constraints on frames that can be allocated
with this hardware device.

Direct mapping to av_hwdevice_get_hwframe_constraints().

#### Parameters

##### hwconfig?

`bigint`

Optional hardware configuration

#### Returns

`null` \| \{ `maxHeight`: `number`; `maxWidth`: `number`; `minHeight`: `number`; `minWidth`: `number`; `validHwFormats?`: `number`[]; `validSwFormats?`: `number`[]; \}

Frame constraints, or null if not available

#### Example

```typescript
const constraints = device.getHwframeConstraints();
if (constraints) {
  console.log(`Min size: ${constraints.minWidth}x${constraints.minHeight}`);
  console.log(`Max size: ${constraints.maxWidth}x${constraints.maxHeight}`);
  if (constraints.validSwFormats) {
    console.log('Software formats:', constraints.validSwFormats);
  }
  if (constraints.validHwFormats) {
    console.log('Hardware formats:', constraints.validHwFormats);
  }
}
```

***

### getNative()

> **getNative**(): `NativeHardwareDeviceContext`

Defined in: [src/lib/hardware-device-context.ts:379](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L379)

**`Internal`**

Get the underlying native HardwareDeviceContext object.

#### Returns

`NativeHardwareDeviceContext`

The native HardwareDeviceContext binding object

#### Implementation of

`NativeWrapper.getNative`

***

### hwconfigAlloc()

> **hwconfigAlloc**(): `null` \| `bigint`

Defined in: [src/lib/hardware-device-context.ts:331](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L331)

Allocate hardware configuration.

Allocates a hardware-specific configuration structure.
Used for codec configuration with hardware acceleration.

Direct mapping to av_hwdevice_hwconfig_alloc().

#### Returns

`null` \| `bigint`

Configuration pointer, or null on failure

#### Example

```typescript
const hwconfig = device.hwconfigAlloc();
if (hwconfig) {
  // Use with codec context
  codecContext.hwConfig = hwconfig;
}
```

#### See

[getHwframeConstraints](#gethwframeconstraints) To get constraints

***

### init()

> **init**(): `number`

Defined in: [src/lib/hardware-device-context.ts:207](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L207)

Initialize allocated hardware device.

Initializes a previously allocated hardware device context.
Must be called after alloc() and before using the device.

Direct mapping to av_hwdevice_ctx_init().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure
  - Device-specific errors

#### Example

```typescript
import { FFmpegError } from 'node-av';

device.alloc(type);
const ret = device.init();
FFmpegError.throwIfError(ret, 'init');
```

#### See

 - [alloc](#alloc) Must be called first
 - [create](#create) For combined operation

***

### findTypeByName()

> `static` **findTypeByName**(`name`): `AVHWDeviceType`

Defined in: [src/lib/hardware-device-context.ts:126](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L126)

Find hardware device type by name.

Converts a string name to the corresponding hardware device type enum.

Direct mapping to av_hwdevice_find_type_by_name().

#### Parameters

##### name

`string`

Hardware type name (e.g., 'cuda', 'vaapi', 'videotoolbox')

#### Returns

`AVHWDeviceType`

Hardware device type enum, or AV_HWDEVICE_TYPE_NONE if not found

#### Example

```typescript
const type = HardwareDeviceContext.findTypeByName('cuda');
if (type !== AV_HWDEVICE_TYPE_NONE) {
  console.log('CUDA is available');
}
```

#### See

[getTypeName](#gettypename) For type to name conversion

***

### getTypeName()

> `static` **getTypeName**(`type`): `null` \| `string`

Defined in: [src/lib/hardware-device-context.ts:78](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L78)

Get human-readable name for hardware device type.

Converts a hardware device type enum to its string representation.

Direct mapping to av_hwdevice_get_type_name().

#### Parameters

##### type

`AVHWDeviceType`

Hardware device type

#### Returns

`null` \| `string`

Type name string, or null if invalid

#### Example

```typescript
import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';

const name = HardwareDeviceContext.getTypeName(AV_HWDEVICE_TYPE_CUDA);
console.log(name); // "cuda"
```

#### See

[findTypeByName](#findtypebyname) For reverse lookup

***

### iterateTypes()

> `static` **iterateTypes**(): `AVHWDeviceType`[]

Defined in: [src/lib/hardware-device-context.ts:102](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-device-context.ts#L102)

List all supported hardware device types.

Returns an array of all hardware acceleration types available
in the current FFmpeg build.

Direct mapping to av_hwdevice_iterate_types().

#### Returns

`AVHWDeviceType`[]

Array of available hardware device types

#### Example

```typescript
const types = HardwareDeviceContext.iterateTypes();
console.log('Available hardware acceleration:');
for (const type of types) {
  const name = HardwareDeviceContext.getTypeName(type);
  console.log(`  - ${name}`);
}
```
