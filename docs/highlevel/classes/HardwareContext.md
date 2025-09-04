[node-av](../globals.md) / HardwareContext

# Class: HardwareContext

Defined in: [hardware.ts:72](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L72)

High-level hardware acceleration management.

Provides automatic detection and configuration of hardware acceleration for media processing.
Manages device contexts for GPU-accelerated encoding and decoding operations.
Supports various hardware types including VideoToolbox, CUDA, VAAPI, D3D11VA, and more.
Essential for high-performance video processing with reduced CPU usage.

## Examples

```typescript
import { HardwareContext } from '@seydx/av/api';
import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';

// Auto-detect best available hardware
const hw = HardwareContext.auto();
if (hw) {
  console.log(`Using hardware: ${hw.deviceTypeName}`);
  const decoder = await Decoder.create(stream, { hardware: hw });
}
```

```typescript
// Use specific hardware type
const cuda = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
const encoder = await Encoder.create('h264_nvenc', streamInfo, {
  hardware: cuda
});
cuda.dispose();
```

## See

 - [Decoder](Decoder.md) For hardware-accelerated decoding
 - [Encoder](Encoder.md) For hardware-accelerated encoding
 - HardwareFilterPresets For hardware filter operations

## Implements

- `Disposable`

## Properties

### filterPresets

> `readonly` **filterPresets**: `HardwareFilterPresets`

Defined in: [hardware.ts:77](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L77)

Hardware-specific filter presets for this device.
Provides convenient filter builders for hardware-accelerated operations.

## Accessors

### deviceContext

#### Get Signature

> **get** **deviceContext**(): `HardwareDeviceContext`

Defined in: [hardware.ts:245](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L245)

Get the hardware device context.

Used internally by encoders and decoders for hardware acceleration.
Can be assigned to CodecContext.hwDeviceCtx.

##### Example

```typescript
codecContext.hwDeviceCtx = hw.deviceContext;
```

##### Returns

`HardwareDeviceContext`

***

### devicePixelFormat

#### Get Signature

> **get** **devicePixelFormat**(): `AVPixelFormat`

Defined in: [hardware.ts:288](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L288)

Get the device pixel format.

Hardware-specific pixel format for frame allocation.

##### Example

```typescript
frame.format = hw.devicePixelFormat;
```

##### Returns

`AVPixelFormat`

***

### deviceType

#### Get Signature

> **get** **deviceType**(): `AVHWDeviceType`

Defined in: [hardware.ts:259](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L259)

Get the device type enum value.

##### Example

```typescript
if (hw.deviceType === AV_HWDEVICE_TYPE_CUDA) {
  console.log('Using NVIDIA GPU');
}
```

##### Returns

`AVHWDeviceType`

***

### deviceTypeName

#### Get Signature

> **get** **deviceTypeName**(): `string`

Defined in: [hardware.ts:274](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L274)

Get the hardware device type name.

Human-readable device type string.

##### Example

```typescript
console.log(`Hardware type: ${hw.deviceTypeName}`);
// Output: "cuda" or "videotoolbox" etc.
```

##### Returns

`string`

***

### isDisposed

#### Get Signature

> **get** **isDisposed**(): `boolean`

Defined in: [hardware.ts:302](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L302)

Check if this hardware context has been disposed.

##### Example

```typescript
if (!hw.isDisposed) {
  hw.dispose();
}
```

##### Returns

`boolean`

## Methods

### \[dispose\]()

> **\[dispose\]**(): `void`

Defined in: [hardware.ts:757](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L757)

Dispose of hardware context.

Implements Disposable interface for automatic cleanup.
Equivalent to calling dispose().

#### Returns

`void`

#### Example

```typescript
{
  using hw = HardwareContext.auto();
  // Use hardware context...
} // Automatically disposed
```

#### See

[dispose](#dispose-2) For manual cleanup

#### Implementation of

`Disposable.[dispose]`

***

### dispose()

> **dispose**(): `void`

Defined in: [hardware.ts:559](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L559)

Clean up and free hardware resources.

Releases the hardware device context.
Safe to call multiple times.
Automatically called by Symbol.dispose.

#### Returns

`void`

#### Example

```typescript
const hw = HardwareContext.auto();
try {
  // Use hardware
} finally {
  hw?.dispose();
}
```

#### See

Symbol.dispose For automatic cleanup

***

### findSupportedCodecs()

> **findSupportedCodecs**(`isEncoder`): `string`[]

Defined in: [hardware.ts:510](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L510)

Find all codecs that support this hardware device.

Iterates through all available codecs and checks hardware compatibility.
Useful for discovering available hardware acceleration options.

Direct mapping to av_codec_iterate() with hardware config checks.

#### Parameters

##### isEncoder

`boolean` = `false`

Find encoders (true) or decoders (false)

#### Returns

`string`[]

Array of codec names that support this hardware

#### Example

```typescript
const decoders = hw.findSupportedCodecs(false);
console.log('Hardware decoders:', decoders);
// ["h264_cuvid", "hevc_cuvid", ...]

const encoders = hw.findSupportedCodecs(true);
console.log('Hardware encoders:', encoders);
// ["h264_nvenc", "hevc_nvenc", ...]
```

#### See

[supportsCodec](#supportscodec) For checking specific codec

***

### getEncoderCodec()

> **getEncoderCodec**(`codecName`): `Promise`\<`null` \| `Codec`\>

Defined in: [hardware.ts:411](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L411)

Get the appropriate encoder codec for a given base codec name.

Maps generic codec names to hardware-specific encoder implementations.
Returns null if no hardware encoder is available for the codec.
Automatically tests encoder viability before returning.

#### Parameters

##### codecName

[`BaseCodecName`](../type-aliases/BaseCodecName.md)

Generic codec name (e.g., 'h264', 'hevc', 'av1')

#### Returns

`Promise`\<`null` \| `Codec`\>

Hardware encoder codec or null if unsupported

#### Examples

```typescript
const encoderCodec = await hw.getEncoderCodec('h264');
if (encoderCodec) {
  console.log(`Using encoder: ${encoderCodec.name}`);
  // e.g., "h264_nvenc" for CUDA
}
```

```typescript
// Use with Encoder.create
const codec = await hw.getEncoderCodec('hevc');
if (codec) {
  const encoder = await Encoder.create(codec, streamInfo, {
    hardware: hw
  });
}
```

#### See

[Encoder.create](Encoder.md#create) For using the codec

***

### supportsCodec()

> **supportsCodec**(`codecId`, `isEncoder`): `boolean`

Defined in: [hardware.ts:329](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L329)

Check if this hardware type supports a specific codec.

Queries FFmpeg's codec configurations to verify hardware support.
Checks both decoder and encoder support based on parameters.

Direct mapping to avcodec_get_hw_config().

#### Parameters

##### codecId

`AVCodecID`

Codec ID from AVCodecID enum

##### isEncoder

`boolean` = `false`

Check for encoder support (default: decoder)

#### Returns

`boolean`

true if codec is supported

#### Example

```typescript
import { AV_CODEC_ID_H264 } from '@seydx/av/constants';

if (hw.supportsCodec(AV_CODEC_ID_H264, true)) {
  // Can use hardware H.264 encoder
}
```

#### See

[findSupportedCodecs](#findsupportedcodecs) For all supported codecs

***

### supportsPixelFormat()

> **supportsPixelFormat**(`codecId`, `pixelFormat`, `isEncoder`): `boolean`

Defined in: [hardware.ts:365](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L365)

Check if this hardware supports a specific pixel format for a codec.

Verifies pixel format compatibility with hardware codec.
Important for ensuring format compatibility in pipelines.

#### Parameters

##### codecId

`AVCodecID`

Codec ID from AVCodecID enum

##### pixelFormat

`AVPixelFormat`

Pixel format to check

##### isEncoder

`boolean` = `false`

Check for encoder (default: decoder)

#### Returns

`boolean`

true if pixel format is supported

#### Example

```typescript
import { AV_CODEC_ID_H264, AV_PIX_FMT_NV12 } from '@seydx/av/constants';

if (hw.supportsPixelFormat(AV_CODEC_ID_H264, AV_PIX_FMT_NV12)) {
  // Can use NV12 format with H.264
}
```

#### See

[supportsCodec](#supportscodec) For basic codec support

***

### auto()

> `static` **auto**(`options`): `null` \| `HardwareContext`

Defined in: [hardware.ts:129](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L129)

Auto-detect and create the best available hardware context.

Tries hardware types in order of preference based on platform.
Returns null if no hardware acceleration is available.
Platform-specific preference order ensures optimal performance.

#### Parameters

##### options

[`HardwareOptions`](../interfaces/HardwareOptions.md) = `{}`

Optional hardware configuration

#### Returns

`null` \| `HardwareContext`

Hardware context or null if unavailable

#### Examples

```typescript
const hw = HardwareContext.auto();
if (hw) {
  console.log(`Auto-detected: ${hw.deviceTypeName}`);
  // Use for decoder/encoder
}
```

```typescript
// With specific device
const hw = HardwareContext.auto({
  deviceName: '/dev/dri/renderD128'
});
```

#### See

 - [create](#create) For specific hardware type
 - [listAvailable](#listavailable) To check available types

***

### create()

> `static` **create**(`deviceType`, `device?`, `options?`): `HardwareContext`

Defined in: [hardware.ts:188](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L188)

Create a hardware context for a specific device type.

Creates and initializes a hardware device context.
Throws if the device type is not supported or initialization fails.

Direct mapping to av_hwdevice_ctx_create().

#### Parameters

##### deviceType

`AVHWDeviceType`

Hardware device type from AVHWDeviceType

##### device?

`string`

Optional device specifier (e.g., GPU index, device path)

##### options?

`Record`\<`string`, `string`\>

Optional device initialization options

#### Returns

`HardwareContext`

Initialized hardware context

#### Throws

If device type unsupported or initialization fails

#### Examples

```typescript
import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';

// CUDA with specific GPU
const cuda = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA, '0');
```

```typescript
import { AV_HWDEVICE_TYPE_VAAPI } from '@seydx/av/constants';

// VAAPI with render device
const vaapi = HardwareContext.create(
  AV_HWDEVICE_TYPE_VAAPI,
  '/dev/dri/renderD128'
);
```

#### See

 - [auto](#auto) For automatic detection
 - HardwareDeviceContext For low-level API

***

### listAvailable()

> `static` **listAvailable**(): `string`[]

Defined in: [hardware.ts:220](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/hardware.ts#L220)

List all available hardware device types.

Enumerates all hardware types supported by the FFmpeg build.
Useful for checking hardware capabilities at runtime.

Direct mapping to av_hwdevice_iterate_types().

#### Returns

`string`[]

Array of available device type names

#### Example

```typescript
const available = HardwareContext.listAvailable();
console.log('Available hardware:', available.join(', '));
// Output: "cuda, vaapi, videotoolbox"
```

#### See

[auto](#auto) For automatic selection
