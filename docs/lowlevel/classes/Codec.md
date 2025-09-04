[node-av](../globals.md) / Codec

# Class: Codec

Defined in: [src/lib/codec.ts:53](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L53)

Codec descriptor for audio/video encoding and decoding.

Represents an encoder or decoder implementation that can process media data.
Contains codec capabilities, supported formats, and hardware acceleration information.
Used to create codec contexts for actual encoding/decoding operations.
Supports both software and hardware-accelerated codecs.

Direct mapping to FFmpeg's AVCodec.

## Example

```typescript
import { Codec, FFmpegError } from 'node-av';
import { AV_CODEC_ID_H264 } from 'node-av/constants';

// Find decoder by ID
const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
if (!decoder) {
  throw new Error('H.264 decoder not available');
}

// Find encoder by name
const encoder = Codec.findEncoderByName('libx264');
if (!encoder) {
  throw new Error('libx264 encoder not available');
}

// Check capabilities
console.log(`Codec: ${decoder.name}`);
console.log(`Type: ${decoder.type}`);
console.log(`Hardware: ${decoder.hasHardwareAcceleration()}`);

// Get supported pixel formats
const formats = decoder.pixelFormats;
if (formats) {
  console.log(`Supported formats: ${formats.join(', ')}`);
}
```

## See

 - \[AVCodec\](https://ffmpeg.org/doxygen/trunk/structAVCodec.html)
 - [CodecContext](CodecContext.md) For encoding/decoding operations

## Implements

- `NativeWrapper`\<`NativeCodec`\>

## Constructors

### Constructor

> **new Codec**(`native`): `Codec`

Defined in: [src/lib/codec.ts:60](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L60)

**`Internal`**

#### Parameters

##### native

`NativeCodec`

The native codec instance

#### Returns

`Codec`

## Accessors

### capabilities

#### Get Signature

> **get** **capabilities**(): `AVCodecCap`

Defined in: [src/lib/codec.ts:302](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L302)

Codec capabilities.

Bitfield of AV_CODEC_CAP_* flags indicating codec features.

Direct mapping to AVCodec->capabilities.

##### Returns

`AVCodecCap`

***

### channelLayouts

#### Get Signature

> **get** **channelLayouts**(): `null` \| [`ChannelLayout`](../interfaces/ChannelLayout.md)[]

Defined in: [src/lib/codec.ts:397](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L397)

Supported channel layouts.

Array of channel layouts this audio codec supports.
Null for video codecs.

Direct mapping to AVCodec->ch_layouts.

##### Returns

`null` \| [`ChannelLayout`](../interfaces/ChannelLayout.md)[]

***

### id

#### Get Signature

> **get** **id**(): `AVCodecID`

Defined in: [src/lib/codec.ts:291](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L291)

Codec ID.

Unique identifier for the codec format.

Direct mapping to AVCodec->id.

##### Returns

`AVCodecID`

***

### longName

#### Get Signature

> **get** **longName**(): `null` \| `string`

Defined in: [src/lib/codec.ts:269](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L269)

Codec long name.

Human-readable description of the codec.

Direct mapping to AVCodec->long_name.

##### Returns

`null` \| `string`

***

### maxLowres

#### Get Signature

> **get** **maxLowres**(): `number`

Defined in: [src/lib/codec.ts:313](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L313)

Maximum lowres value.

Maximum value for lowres decoding (0 = no lowres support).

Direct mapping to AVCodec->max_lowres.

##### Returns

`number`

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/codec.ts:258](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L258)

Codec name.

Short name identifier for the codec (e.g., 'h264', 'aac').

Direct mapping to AVCodec->name.

##### Returns

`null` \| `string`

***

### pixelFormats

#### Get Signature

> **get** **pixelFormats**(): `null` \| `AVPixelFormat`[]

Defined in: [src/lib/codec.ts:361](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L361)

Supported pixel formats.

Array of pixel formats this video codec supports.
Null for audio codecs.

Direct mapping to AVCodec->pix_fmts.

##### Returns

`null` \| `AVPixelFormat`[]

***

### profiles

#### Get Signature

> **get** **profiles**(): `null` \| [`CodecProfile`](../interfaces/CodecProfile.md)[]

Defined in: [src/lib/codec.ts:324](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L324)

Supported profiles.

Array of profiles this codec can handle (e.g., baseline, main, high).

Direct mapping to AVCodec->profiles.

##### Returns

`null` \| [`CodecProfile`](../interfaces/CodecProfile.md)[]

***

### sampleFormats

#### Get Signature

> **get** **sampleFormats**(): `null` \| `AVSampleFormat`[]

Defined in: [src/lib/codec.ts:385](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L385)

Supported sample formats.

Array of sample formats this audio codec supports.
Null for video codecs.

Direct mapping to AVCodec->sample_fmts.

##### Returns

`null` \| `AVSampleFormat`[]

***

### supportedFramerates

#### Get Signature

> **get** **supportedFramerates**(): `null` \| [`Rational`](Rational.md)[]

Defined in: [src/lib/codec.ts:347](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L347)

Supported frame rates.

Array of frame rates this video codec supports.
Null for audio codecs or if all rates are supported.

Direct mapping to AVCodec->supported_framerates.

##### Returns

`null` \| [`Rational`](Rational.md)[]

***

### supportedSamplerates

#### Get Signature

> **get** **supportedSamplerates**(): `null` \| `number`[]

Defined in: [src/lib/codec.ts:373](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L373)

Supported sample rates.

Array of sample rates this audio codec supports.
Null for video codecs or if all rates are supported.

Direct mapping to AVCodec->supported_samplerates.

##### Returns

`null` \| `number`[]

***

### type

#### Get Signature

> **get** **type**(): `AVMediaType`

Defined in: [src/lib/codec.ts:280](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L280)

Media type.

Type of media this codec processes (video, audio, subtitle, etc.).

Direct mapping to AVCodec->type.

##### Returns

`AVMediaType`

***

### wrapper

#### Get Signature

> **get** **wrapper**(): `null` \| `string`

Defined in: [src/lib/codec.ts:335](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L335)

Wrapper name.

Name of the codec wrapper, if this is a wrapper codec.

Direct mapping to AVCodec->wrapper_name.

##### Returns

`null` \| `string`

## Methods

### getHardwareMethod()

> **getHardwareMethod**(`deviceType`): `null` \| `number`

Defined in: [src/lib/codec.ts:645](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L645)

Get hardware method flags for device type.

Returns the hardware configuration methods for a specific device.

#### Parameters

##### deviceType

`AVHWDeviceType`

Device type to query

#### Returns

`null` \| `number`

Method flags, or null if not supported

#### Example

```typescript
import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';

const methods = codec.getHardwareMethod(AV_HWDEVICE_TYPE_CUDA);
if (methods) {
  if (methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) {
    console.log('Supports device context');
  }
}
```

***

### getHwConfig()

> **getHwConfig**(`index`): `null` \| \{ `deviceType`: `AVHWDeviceType`; `methods`: `number`; `pixFmt`: `AVPixelFormat`; \}

Defined in: [src/lib/codec.ts:682](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L682)

Get hardware configuration at index.

Retrieves hardware acceleration configuration details.

Direct mapping to avcodec_get_hw_config().

#### Parameters

##### index

`number`

Configuration index

#### Returns

`null` \| \{ `deviceType`: `AVHWDeviceType`; `methods`: `number`; `pixFmt`: `AVPixelFormat`; \}

Hardware configuration, or null if index out of range

#### Example

```typescript
// Enumerate all hardware configs
for (let i = 0; ; i++) {
  const config = codec.getHwConfig(i);
  if (!config) break;

  console.log(`Config ${i}:`);
  console.log(`  Pixel format: ${config.pixFmt}`);
  console.log(`  Device type: ${config.deviceType}`);
  console.log(`  Methods: 0x${config.methods.toString(16)}`);
}
```

***

### getNative()

> **getNative**(): `NativeCodec`

Defined in: [src/lib/codec.ts:697](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L697)

**`Internal`**

Get the underlying native Codec object.

#### Returns

`NativeCodec`

The native Codec binding object

#### Implementation of

`NativeWrapper.getNative`

***

### getSupportedDeviceTypes()

> **getSupportedDeviceTypes**(): `AVHWDeviceType`[]

Defined in: [src/lib/codec.ts:609](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L609)

Get supported hardware device types.

Returns all hardware acceleration types this codec supports.

#### Returns

`AVHWDeviceType`[]

Array of supported device types

#### Example

```typescript
const devices = codec.getSupportedDeviceTypes();
console.log('Supported devices:', devices.map(d => {
  switch(d) {
    case AV_HWDEVICE_TYPE_CUDA: return 'CUDA';
    case AV_HWDEVICE_TYPE_VAAPI: return 'VAAPI';
    default: return 'Unknown';
  }
}));
```

#### See

[supportsDevice](#supportsdevice) To check specific device

***

### hasHardwareAcceleration()

> **hasHardwareAcceleration**(): `boolean`

Defined in: [src/lib/codec.ts:475](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L475)

Check if codec supports hardware acceleration.

Checks if the codec has any hardware configuration.

#### Returns

`boolean`

True if hardware acceleration is available

#### Example

```typescript
const codec = Codec.findDecoderByName('h264_cuvid');
if (codec?.hasHardwareAcceleration()) {
  console.log('Hardware acceleration available');
}
```

#### See

[getSupportedDeviceTypes](#getsupporteddevicetypes) For specific device types

***

### isDecoder()

> **isDecoder**(): `boolean`

Defined in: [src/lib/codec.ts:435](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L435)

Check if codec is a decoder.

#### Returns

`boolean`

True if this codec can decode

#### Example

```typescript
const codec = Codec.findDecoder(AV_CODEC_ID_H264);
if (codec?.isDecoder()) {
  console.log('This is a decoder');
}
```

#### See

[isEncoder](#isencoder) To check for encoders

***

### isEncoder()

> **isEncoder**(): `boolean`

Defined in: [src/lib/codec.ts:416](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L416)

Check if codec is an encoder.

#### Returns

`boolean`

True if this codec can encode

#### Example

```typescript
const codec = Codec.findEncoderByName('libx264');
if (codec?.isEncoder()) {
  console.log('This is an encoder');
}
```

#### See

[isDecoder](#isdecoder) To check for decoders

***

### isExperimental()

> **isExperimental**(): `boolean`

Defined in: [src/lib/codec.ts:454](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L454)

Check if codec is experimental.

Experimental codecs require explicit opt-in to use.

#### Returns

`boolean`

True if codec is marked experimental

#### Example

```typescript
if (codec.isExperimental()) {
  console.warn('This codec is experimental');
  // Need to set strict_std_compliance = -2
}
```

***

### isHardwareAcceleratedDecoder()

> **isHardwareAcceleratedDecoder**(`deviceType?`): `boolean`

Defined in: [src/lib/codec.ts:547](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L547)

Check if decoder supports hardware acceleration.

#### Parameters

##### deviceType?

`AVHWDeviceType`

Optional specific device type

#### Returns

`boolean`

True if hardware decoding is supported

#### Example

```typescript
import { AV_HWDEVICE_TYPE_VIDEOTOOLBOX } from 'node-av/constants';

// Check any hardware support
if (codec.isHardwareAcceleratedDecoder()) {
  console.log('Hardware decoding available');
}

// Check specific device
if (codec.isHardwareAcceleratedDecoder(AV_HWDEVICE_TYPE_VIDEOTOOLBOX)) {
  console.log('VideoToolbox decoding available');
}
```

***

### isHardwareAcceleratedEncoder()

> **isHardwareAcceleratedEncoder**(`deviceType?`): `boolean`

Defined in: [src/lib/codec.ts:578](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L578)

Check if encoder supports hardware acceleration.

#### Parameters

##### deviceType?

`AVHWDeviceType`

Optional specific device type

#### Returns

`boolean`

True if hardware encoding is supported

#### Example

```typescript
import { AV_HWDEVICE_TYPE_VAAPI } from 'node-av/constants';

// Check any hardware support
if (codec.isHardwareAcceleratedEncoder()) {
  console.log('Hardware encoding available');
}

// Check specific device
if (codec.isHardwareAcceleratedEncoder(AV_HWDEVICE_TYPE_VAAPI)) {
  console.log('VAAPI encoding available');
}
```

***

### supportsDevice()

> **supportsDevice**(`deviceType`): `boolean`

Defined in: [src/lib/codec.ts:509](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L509)

Check if codec supports specific device type.

#### Parameters

##### deviceType

`AVHWDeviceType`

Hardware device type to check

#### Returns

`boolean`

True if device type is supported

#### Example

```typescript
import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';

if (codec.supportsDevice(AV_HWDEVICE_TYPE_CUDA)) {
  console.log('Supports NVIDIA CUDA');
}
```

#### See

[getSupportedDeviceTypes](#getsupporteddevicetypes) For all supported types

***

### findDecoder()

> `static` **findDecoder**(`id`): `null` \| `Codec`

Defined in: [src/lib/codec.ts:91](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L91)

Find a decoder by codec ID.

Searches for a decoder that can decode the specified codec format.

Direct mapping to avcodec_find_decoder().

#### Parameters

##### id

`AVCodecID`

Codec ID to search for

#### Returns

`null` \| `Codec`

Decoder if found, null otherwise

#### Example

```typescript
import { AV_CODEC_ID_H264, AV_CODEC_ID_AAC } from 'node-av/constants';

// Find H.264 video decoder
const h264 = Codec.findDecoder(AV_CODEC_ID_H264);
if (h264) {
  console.log(`Found: ${h264.name}`);
}

// Find AAC audio decoder
const aac = Codec.findDecoder(AV_CODEC_ID_AAC);
```

#### See

 - [findDecoderByName](#finddecoderbyname) To find by name
 - [findEncoder](#findencoder) To find encoders

***

### findDecoderByName()

> `static` **findDecoderByName**(`name`): `null` \| `Codec`

Defined in: [src/lib/codec.ts:121](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L121)

Find a decoder by name.

Searches for a specific decoder implementation by name.
Useful when multiple decoders exist for the same codec.

Direct mapping to avcodec_find_decoder_by_name().

#### Parameters

##### name

`FFDecoderCodec`

Decoder name

#### Returns

`null` \| `Codec`

Decoder if found, null otherwise

#### Example

```typescript
// Find specific H.264 decoder
const decoder = Codec.findDecoderByName('h264_cuvid');
if (decoder) {
  console.log('Found NVIDIA hardware decoder');
}

// Find software decoder
const sw = Codec.findDecoderByName('h264');
```

#### See

[findDecoder](#finddecoder) To find by codec ID

***

### findEncoder()

> `static` **findEncoder**(`id`): `null` \| `Codec`

Defined in: [src/lib/codec.ts:153](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L153)

Find an encoder by codec ID.

Searches for an encoder that can encode to the specified codec format.

Direct mapping to avcodec_find_encoder().

#### Parameters

##### id

`AVCodecID`

Codec ID to search for

#### Returns

`null` \| `Codec`

Encoder if found, null otherwise

#### Example

```typescript
import { AV_CODEC_ID_H264, AV_CODEC_ID_AAC } from 'node-av/constants';

// Find H.264 video encoder
const h264 = Codec.findEncoder(AV_CODEC_ID_H264);
if (h264) {
  console.log(`Found: ${h264.name}`);
}

// Find AAC audio encoder
const aac = Codec.findEncoder(AV_CODEC_ID_AAC);
```

#### See

 - [findEncoderByName](#findencoderbyname) To find by name
 - [findDecoder](#finddecoder) To find decoders

***

### findEncoderByName()

> `static` **findEncoderByName**(`name`): `null` \| `Codec`

Defined in: [src/lib/codec.ts:183](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L183)

Find an encoder by name.

Searches for a specific encoder implementation by name.
Useful when multiple encoders exist for the same codec.

Direct mapping to avcodec_find_encoder_by_name().

#### Parameters

##### name

`FFEncoderCodec`

Encoder name

#### Returns

`null` \| `Codec`

Encoder if found, null otherwise

#### Example

```typescript
// Find specific H.264 encoder
const x264 = Codec.findEncoderByName('libx264');
if (x264) {
  console.log('Found x264 encoder');
}

// Find hardware encoder
const nvenc = Codec.findEncoderByName('h264_nvenc');
```

#### See

[findEncoder](#findencoder) To find by codec ID

***

### fromNative()

> `static` **fromNative**(`native`): `null` \| `Codec`

Defined in: [src/lib/codec.ts:709](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L709)

**`Internal`**

Create codec from native instance.

#### Parameters

##### native

Native codec instance

`null` | `NativeCodec`

#### Returns

`null` \| `Codec`

Codec wrapper or null

***

### getCodecList()

> `static` **getCodecList**(): `Codec`[]

Defined in: [src/lib/codec.ts:212](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L212)

Get list of all available codecs.

Returns all registered codecs (both encoders and decoders).

#### Returns

`Codec`[]

Array of all available codecs

#### Example

```typescript
// List all codecs
const codecs = Codec.getCodecList();
console.log(`Total codecs: ${codecs.length}`);

// Filter encoders
const encoders = codecs.filter(c => c.isEncoder());
console.log(`Encoders: ${encoders.length}`);

// Filter hardware codecs
const hw = codecs.filter(c => c.hasHardwareAcceleration());
console.log(`Hardware codecs: ${hw.length}`);
```

#### See

[iterateCodecs](#iteratecodecs) For memory-efficient iteration

***

### iterateCodecs()

> `static` **iterateCodecs**(`opaque`): `null` \| \{ `codec`: `Codec`; `opaque`: `bigint`; \}

Defined in: [src/lib/codec.ts:241](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/codec.ts#L241)

Iterate through available codecs.

Memory-efficient way to iterate through all codecs.
Uses an opaque pointer to track iteration state.

Direct mapping to av_codec_iterate().

#### Parameters

##### opaque

Iteration state (null to start)

`null` | `bigint`

#### Returns

`null` \| \{ `codec`: `Codec`; `opaque`: `bigint`; \}

Next codec and state, or null when done

#### Example

```typescript
// Iterate all codecs
let iter = null;
let result;
while ((result = Codec.iterateCodecs(iter))) {
  console.log(`Codec: ${result.codec.name}`);
  iter = result.opaque;
}
```

#### See

[getCodecList](#getcodeclist) For simple array access
