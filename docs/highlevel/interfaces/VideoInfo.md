[node-av](../globals.md) / VideoInfo

# Interface: VideoInfo

Defined in: [types.ts:12](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L12)

Video stream information.

Contains all necessary parameters to describe a video stream.
Used for encoder and filter initialization.

## Properties

### frameRate?

> `optional` **frameRate**: `IRational`

Defined in: [types.ts:29](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L29)

Frame rate (optional, can be derived from timeBase)

***

### height

> **height**: `number`

Defined in: [types.ts:20](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L20)

Video height in pixels

***

### pixelFormat

> **pixelFormat**: `AVPixelFormat`

Defined in: [types.ts:23](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L23)

Pixel format

***

### sampleAspectRatio?

> `optional` **sampleAspectRatio**: `IRational`

Defined in: [types.ts:32](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L32)

Sample aspect ratio (optional, defaults to 1:1)

***

### timeBase

> **timeBase**: `IRational`

Defined in: [types.ts:26](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L26)

Time base (required for timing)

***

### type

> **type**: `"video"`

Defined in: [types.ts:14](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L14)

Discriminator for TypeScript type narrowing

***

### width

> **width**: `number`

Defined in: [types.ts:17](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/types.ts#L17)

Video width in pixels
