[node-av](../globals.md) / VideoRawData

# Interface: VideoRawData

Defined in: [types.ts:70](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L70)

Raw video data configuration.

Specifies parameters for opening raw video files like YUV.

## Properties

### frameRate

> **frameRate**: `IRational`

Defined in: [types.ts:87](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L87)

Frame rate as a rational

***

### height

> **height**: `number`

Defined in: [types.ts:81](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L81)

Video height

***

### input

> **input**: `string` \| `Buffer`\<`ArrayBufferLike`\>

Defined in: [types.ts:75](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L75)

Raw audio input source (file path, Buffer, or stream)

***

### pixelFormat

> **pixelFormat**: `AVPixelFormat`

Defined in: [types.ts:84](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L84)

Pixel format (e.g., AV_PIX_FMT_YUV420P, AV_PIX_FMT_NV12, AV_PIX_FMT_RGB24)

***

### type

> **type**: `"video"`

Defined in: [types.ts:72](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L72)

Type discriminator for TypeScript

***

### width

> **width**: `number`

Defined in: [types.ts:78](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L78)

Video width
