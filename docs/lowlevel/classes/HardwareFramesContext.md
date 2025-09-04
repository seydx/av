[node-av](../globals.md) / HardwareFramesContext

# Class: HardwareFramesContext

Defined in: [src/lib/hardware-frames-context.ts:58](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L58)

Hardware frames context for GPU memory management.

Manages pools of hardware frames (textures/surfaces) on the GPU.
Essential for zero-copy hardware acceleration, allowing frames to stay
in GPU memory throughout the processing pipeline. Provides frame allocation,
format conversion, and data transfer between hardware and system memory.

Direct mapping to FFmpeg's AVHWFramesContext.

## Example

```typescript
import { HardwareFramesContext, HardwareDeviceContext, Frame, FFmpegError } from 'node-av';
import { AV_PIX_FMT_NV12, AV_PIX_FMT_CUDA, AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';

// Create hardware frames context
const device = new HardwareDeviceContext();
device.create(AV_HWDEVICE_TYPE_CUDA);

const frames = new HardwareFramesContext();
frames.format = AV_PIX_FMT_CUDA;     // Hardware format
frames.swFormat = AV_PIX_FMT_NV12;   // Software format
frames.width = 1920;
frames.height = 1080;
frames.initialPoolSize = 20;         // Pre-allocate 20 frames

frames.alloc(device);
const ret = frames.init();
FFmpegError.throwIfError(ret, 'init');

// Allocate hardware frame
const hwFrame = new Frame();
const ret2 = frames.getBuffer(hwFrame, 0);
FFmpegError.throwIfError(ret2, 'getBuffer');

// Transfer from CPU to GPU
const cpuFrame = new Frame();
// ... fill cpuFrame with data ...
await frames.transferData(hwFrame, cpuFrame);

// Map hardware frame to CPU for access
const mappedFrame = new Frame();
const ret3 = frames.map(mappedFrame, hwFrame, AV_HWFRAME_MAP_READ);
FFmpegError.throwIfError(ret3, 'map');
```

## See

 - \[AVHWFramesContext\](https://ffmpeg.org/doxygen/trunk/structAVHWFramesContext.html)
 - [HardwareDeviceContext](HardwareDeviceContext.md) For device management
 - [Frame](Frame.md) For frame operations

## Implements

- `Disposable`
- `NativeWrapper`\<`NativeHardwareFramesContext`\>

## Constructors

### Constructor

> **new HardwareFramesContext**(): `HardwareFramesContext`

Defined in: [src/lib/hardware-frames-context.ts:62](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L62)

#### Returns

`HardwareFramesContext`

## Accessors

### deviceRef

#### Get Signature

> **get** **deviceRef**(): `null` \| [`HardwareDeviceContext`](HardwareDeviceContext.md)

Defined in: [src/lib/hardware-frames-context.ts:152](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L152)

Associated hardware device.

Reference to the device context this frames context belongs to.
Automatically set when calling alloc().

Direct mapping to AVHWFramesContext->device_ref.

##### Returns

`null` \| [`HardwareDeviceContext`](HardwareDeviceContext.md)

***

### format

#### Get Signature

> **get** **format**(): `AVPixelFormat`

Defined in: [src/lib/hardware-frames-context.ts:74](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L74)

Hardware pixel format.

The pixel format used for frames in GPU memory.
Hardware-specific format like AV_PIX_FMT_CUDA or AV_PIX_FMT_VAAPI.

Direct mapping to AVHWFramesContext->format.

##### Returns

`AVPixelFormat`

#### Set Signature

> **set** **format**(`value`): `void`

Defined in: [src/lib/hardware-frames-context.ts:78](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L78)

##### Parameters

###### value

`AVPixelFormat`

##### Returns

`void`

***

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: [src/lib/hardware-frames-context.ts:120](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L120)

Frame height.

Height of frames in pixels.

Direct mapping to AVHWFramesContext->height.

##### Returns

`number`

#### Set Signature

> **set** **height**(`value`): `void`

Defined in: [src/lib/hardware-frames-context.ts:124](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L124)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### initialPoolSize

#### Get Signature

> **get** **initialPoolSize**(): `number`

Defined in: [src/lib/hardware-frames-context.ts:136](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L136)

Initial pool size.

Number of frames to pre-allocate in the pool.
Set before calling init() for optimal performance.

Direct mapping to AVHWFramesContext->initial_pool_size.

##### Returns

`number`

#### Set Signature

> **set** **initialPoolSize**(`value`): `void`

Defined in: [src/lib/hardware-frames-context.ts:140](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L140)

##### Parameters

###### value

`number`

##### Returns

`void`

***

### swFormat

#### Get Signature

> **get** **swFormat**(): `AVPixelFormat`

Defined in: [src/lib/hardware-frames-context.ts:90](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L90)

Software pixel format.

The pixel format frames are converted to when transferred
to system memory. Standard format like AV_PIX_FMT_YUV420P.

Direct mapping to AVHWFramesContext->sw_format.

##### Returns

`AVPixelFormat`

#### Set Signature

> **set** **swFormat**(`value`): `void`

Defined in: [src/lib/hardware-frames-context.ts:94](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L94)

##### Parameters

###### value

`AVPixelFormat`

##### Returns

`void`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: [src/lib/hardware-frames-context.ts:105](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L105)

Frame width.

Width of frames in pixels.

Direct mapping to AVHWFramesContext->width.

##### Returns

`number`

#### Set Signature

> **set** **width**(`value`): `void`

Defined in: [src/lib/hardware-frames-context.ts:109](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L109)

##### Parameters

###### value

`number`

##### Returns

`void`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [src/lib/hardware-frames-context.ts:445](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L445)

Dispose of the hardware frames context.

Implements the Disposable interface for automatic cleanup.
Equivalent to calling free().

#### Returns

`void`

#### Example

```typescript
{
  using frames = new HardwareFramesContext();
  frames.alloc(device);
  frames.init();
  // Use frames...
} // Automatically freed when leaving scope
```

#### Implementation of

`Disposable.[dispose]`

***

### alloc()

> **alloc**(`device`): `void`

Defined in: [src/lib/hardware-frames-context.ts:197](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L197)

Allocate hardware frames context.

Allocates the frames context and associates it with a device.
Must be called before init().

Direct mapping to av_hwframe_ctx_alloc().

#### Parameters

##### device

[`HardwareDeviceContext`](HardwareDeviceContext.md)

Hardware device context to use

#### Returns

`void`

#### Throws

If allocation fails (ENOMEM)

#### Example

```typescript
import { AV_PIX_FMT_CUDA, AV_PIX_FMT_NV12 } from 'node-av/constants';

const frames = new HardwareFramesContext();
frames.format = AV_PIX_FMT_CUDA;
frames.swFormat = AV_PIX_FMT_NV12;
frames.width = 1920;
frames.height = 1080;
frames.alloc(device);
```

#### See

[init](#init) To initialize after allocation

***

### createDerived()

> **createDerived**(`format`, `derivedDevice`, `source`, `flags?`): `number`

Defined in: [src/lib/hardware-frames-context.ts:414](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L414)

Create derived frames context.

Creates a new frames context derived from another,
potentially on a different device.

Direct mapping to av_hwframe_ctx_create_derived().

#### Parameters

##### format

`AVPixelFormat`

Pixel format for derived frames

##### derivedDevice

[`HardwareDeviceContext`](HardwareDeviceContext.md)

Target device context

##### source

`HardwareFramesContext`

Source frames context

##### flags?

`number`

Creation flags

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOSYS: Derivation not supported
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_PIX_FMT_VULKAN } from 'node-av/constants';

const derivedFrames = new HardwareFramesContext();
const ret = derivedFrames.createDerived(
  AV_PIX_FMT_VULKAN,
  vulkanDevice,
  cudaFrames,
  0
);
FFmpegError.throwIfError(ret, 'createDerived');
```

***

### free()

> **free**(): `void`

Defined in: [src/lib/hardware-frames-context.ts:246](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L246)

Free hardware frames context.

Releases all frames and resources associated with the context.
The context becomes invalid after calling this.

Direct mapping to av_buffer_unref() on frames context.

#### Returns

`void`

#### Example

```typescript
frames.free();
// Frames context is now invalid
```

#### See

Symbol.dispose For automatic cleanup

***

### getBuffer()

> **getBuffer**(`frame`, `flags?`): `number`

Defined in: [src/lib/hardware-frames-context.ts:276](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L276)

Allocate hardware frame from pool.

Gets a frame from the hardware frame pool.
The frame will have hardware-backed storage.

Direct mapping to av_hwframe_get_buffer().

#### Parameters

##### frame

[`Frame`](Frame.md)

Frame to allocate buffer for

##### flags?

`number`

Allocation flags (usually 0)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_ENOMEM: No frames available in pool
  - AVERROR_EINVAL: Invalid parameters

#### Example

```typescript
import { Frame, FFmpegError } from 'node-av';

const hwFrame = new Frame();
const ret = frames.getBuffer(hwFrame, 0);
FFmpegError.throwIfError(ret, 'getBuffer');
// hwFrame now has GPU memory allocated
```

#### See

[transferData](#transferdata) To upload data to hardware frame

***

### getNative()

> **getNative**(): `NativeHardwareFramesContext`

Defined in: [src/lib/hardware-frames-context.ts:425](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L425)

**`Internal`**

Get the underlying native HardwareFramesContext object.

#### Returns

`NativeHardwareFramesContext`

The native HardwareFramesContext binding object

#### Implementation of

`NativeWrapper.getNative`

***

### init()

> **init**(): `number`

Defined in: [src/lib/hardware-frames-context.ts:226](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L226)

Initialize hardware frames context.

Initializes the frame pool after configuration.
Must be called after alloc() and property setup.

Direct mapping to av_hwframe_ctx_init().

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOMEM: Memory allocation failure
  - AVERROR_ENOSYS: Operation not supported
  - Hardware-specific errors

#### Example

```typescript
import { FFmpegError } from 'node-av';

frames.alloc(device);
const ret = frames.init();
FFmpegError.throwIfError(ret, 'init');
```

#### See

[alloc](#alloc) Must be called first

***

### map()

> **map**(`dst`, `src`, `flags?`): `number`

Defined in: [src/lib/hardware-frames-context.ts:378](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L378)

Map hardware frame to system memory.

Creates a mapping of hardware frame data accessible from CPU.
More efficient than transferData() for read-only access.

Direct mapping to av_hwframe_map().

#### Parameters

##### dst

[`Frame`](Frame.md)

Destination frame for mapped data

##### src

[`Frame`](Frame.md)

Hardware frame to map

##### flags?

`number`

Mapping flags (AV_HWFRAME_MAP_*)

#### Returns

`number`

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOSYS: Mapping not supported

#### Example

```typescript
import { FFmpegError } from 'node-av';
import { AV_HWFRAME_MAP_READ } from 'node-av/constants';

const mappedFrame = new Frame();
const ret = frames.map(mappedFrame, hwFrame, AV_HWFRAME_MAP_READ);
FFmpegError.throwIfError(ret, 'map');
// Can now read hwFrame data through mappedFrame
```

#### See

[transferData](#transferdata) For full data copy

***

### transferData()

> **transferData**(`dst`, `src`, `flags?`): `Promise`\<`number`\>

Defined in: [src/lib/hardware-frames-context.ts:317](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L317)

Transfer data between hardware and system memory.

Copies frame data between GPU and CPU memory.
Direction is determined by frame types.

Direct mapping to av_hwframe_transfer_data().

#### Parameters

##### dst

[`Frame`](Frame.md)

Destination frame

##### src

[`Frame`](Frame.md)

Source frame

##### flags?

`number`

Transfer flags (usually 0)

#### Returns

`Promise`\<`number`\>

0 on success, negative AVERROR on error:
  - AVERROR_EINVAL: Invalid parameters
  - AVERROR_ENOSYS: Transfer not supported
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { FFmpegError } from 'node-av';

// Upload: CPU -> GPU
const cpuFrame = new Frame();
// ... fill cpuFrame with data ...
const hwFrame = new Frame();
frames.getBuffer(hwFrame, 0);
const ret = await frames.transferData(hwFrame, cpuFrame);
FFmpegError.throwIfError(ret, 'transferData');

// Download: GPU -> CPU
const downloadFrame = new Frame();
const ret2 = await frames.transferData(downloadFrame, hwFrame);
FFmpegError.throwIfError(ret2, 'transferData');
```

#### See

 - [getBuffer](#getbuffer) To allocate hardware frame
 - [map](#map) For zero-copy access

***

### transferGetFormats()

> **transferGetFormats**(`direction`): `number` \| `AVPixelFormat`[]

Defined in: [src/lib/hardware-frames-context.ts:346](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/hardware-frames-context.ts#L346)

Get supported transfer formats.

Returns pixel formats supported for frame transfer
in the specified direction.

Direct mapping to av_hwframe_transfer_get_formats().

#### Parameters

##### direction

`AVHWFrameTransferDirection`

Transfer direction (FROM/TO hardware)

#### Returns

`number` \| `AVPixelFormat`[]

Array of supported formats, or error code:
  - AVERROR_ENOSYS: Query not supported
  - AVERROR_ENOMEM: Memory allocation failure

#### Example

```typescript
import { AV_HWFRAME_TRANSFER_DIRECTION_FROM } from 'node-av/constants';

const formats = frames.transferGetFormats(AV_HWFRAME_TRANSFER_DIRECTION_FROM);
if (Array.isArray(formats)) {
  console.log('Supported download formats:', formats);
} else {
  console.error('Error querying formats:', formats);
}
```
