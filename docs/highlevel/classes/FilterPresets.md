[node-av](../globals.md) / FilterPresets

# Class: FilterPresets

Defined in: [filter-presets.ts:756](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L756)

Standard filter presets for software filtering.
Provides static methods for creating common filter strings and
a chain builder for composing complex filter graphs.

## Example

```typescript
// Static methods for individual filters
const scaleFilter = FilterPresets.scale(1920, 1080);
const fpsFilter = FilterPresets.fps(30);

// Chain builder for complex graphs
const chain = FilterPresets.chain()
  .scale(1920, 1080)
  .fps(30)
  .fade('in', 0, 2)
  .build();
```

## Extends

- `FilterPresetBase`

## Constructors

### Constructor

> **new FilterPresets**(): `FilterPresets`

#### Returns

`FilterPresets`

#### Inherited from

`FilterPresetBase.constructor`

## Methods

### afade()

> **afade**(`type`, `start`, `duration`): `null` \| `string`

Defined in: [filter-presets.ts:291](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L291)

Creates an audio fade filter string.

#### Parameters

##### type

Fade type ('in' or 'out')

`"in"` | `"out"`

##### start

`number`

Start time in seconds

##### duration

`number`

Fade duration in seconds

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg afade filter](https://ffmpeg.org/ffmpeg-filters.html#afade)

#### Inherited from

`FilterPresetBase.afade`

***

### aformat()

> **aformat**(`sampleFormat`, `sampleRate?`, `channelLayout?`): `null` \| `string`

Defined in: [filter-presets.ts:258](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L258)

Creates an audio format filter string.

#### Parameters

##### sampleFormat

Target sample format (e.g., 's16', 'fltp')

`string` | `AVSampleFormat`

##### sampleRate?

`number`

Target sample rate in Hz (optional)

##### channelLayout?

`string`

Target channel layout (optional)

#### Returns

`null` \| `string`

Filter string or null if not supported

#### Example

```typescript
// Change sample format only
presets.aformat('s16');

// Change format and sample rate
presets.aformat('fltp', 48000);

// Full conversion
presets.aformat('s16', 44100, 'stereo');
```

#### See

[FFmpeg aformat filter](https://ffmpeg.org/ffmpeg-filters.html#aformat)

#### Inherited from

`FilterPresetBase.aformat`

***

### amix()

> **amix**(`inputs`, `duration`): `null` \| `string`

Defined in: [filter-presets.ts:304](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L304)

Creates an amix filter string to mix multiple audio streams.

#### Parameters

##### inputs

`number` = `2`

Number of input streams to mix (default: 2)

##### duration

How to determine output duration (default: 'longest')

`"first"` | `"longest"` | `"shortest"`

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg amix filter](https://ffmpeg.org/ffmpeg-filters.html#amix)

#### Inherited from

`FilterPresetBase.amix`

***

### atempo()

> **atempo**(`factor`): `null` \| `string`

Defined in: [filter-presets.ts:277](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L277)

Creates an atempo filter string to change audio playback speed.

#### Parameters

##### factor

`number`

Tempo factor (0.5 = half speed, 2.0 = double speed)

#### Returns

`null` \| `string`

Filter string or null if not supported

#### Description

Factor must be between 0.5 and 2.0. For larger changes, chain multiple atempo filters.

#### See

[FFmpeg atempo filter](https://ffmpeg.org/ffmpeg-filters.html#atempo)

#### Inherited from

`FilterPresetBase.atempo`

***

### crop()

> **crop**(`width`, `height`, `x`, `y`): `null` \| `string`

Defined in: [filter-presets.ts:99](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L99)

Creates a crop filter string.

#### Parameters

##### width

`number`

Width of the cropped area

##### height

`number`

Height of the cropped area

##### x

`number` = `0`

X coordinate of top-left corner (default: 0)

##### y

`number` = `0`

Y coordinate of top-left corner (default: 0)

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg crop filter](https://ffmpeg.org/ffmpeg-filters.html#crop)

#### Inherited from

`FilterPresetBase.crop`

***

### fade()

> **fade**(`type`, `start`, `duration`): `null` \| `string`

Defined in: [filter-presets.ts:191](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L191)

Creates a fade filter string for video.

#### Parameters

##### type

Fade type ('in' or 'out')

`"in"` | `"out"`

##### start

`number`

Start time in seconds

##### duration

`number`

Fade duration in seconds

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg fade filter](https://ffmpeg.org/ffmpeg-filters.html#fade)

#### Inherited from

`FilterPresetBase.fade`

***

### format()

> **format**(`pixelFormat`): `null` \| `string`

Defined in: [filter-presets.ts:133](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L133)

Creates a format filter string to convert pixel format.

#### Parameters

##### pixelFormat

Target pixel format(s) - can be string, AVPixelFormat enum, or array

`string` | `AVPixelFormat` | (`string` \| `AVPixelFormat`)[]

#### Returns

`null` \| `string`

Filter string or null if not supported

#### Example

```typescript
// Single format
presets.format('yuv420p');
presets.format(AV_PIX_FMT_YUV420P);

// Multiple formats (creates a chain)
presets.format(['yuv420p', 'rgb24']);
```

#### See

[FFmpeg format filter](https://ffmpeg.org/ffmpeg-filters.html#format)

#### Inherited from

`FilterPresetBase.format`

***

### fps()

> **fps**(`fps`): `null` \| `string`

Defined in: [filter-presets.ts:111](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L111)

Creates an FPS filter string to change frame rate.

#### Parameters

##### fps

`number`

Target frames per second

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg fps filter](https://ffmpeg.org/ffmpeg-filters.html#fps)

#### Inherited from

`FilterPresetBase.fps`

***

### hflip()

> **hflip**(): `null` \| `string`

Defined in: [filter-presets.ts:166](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L166)

Creates a horizontal flip filter string.

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg hflip filter](https://ffmpeg.org/ffmpeg-filters.html#hflip)

#### Inherited from

`FilterPresetBase.hflip`

***

### overlay()

> **overlay**(`x`, `y`, `options?`): `null` \| `string`

Defined in: [filter-presets.ts:214](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L214)

Creates an overlay filter string to composite two video streams.

#### Parameters

##### x

`number` = `0`

X position for overlay (default: 0)

##### y

`number` = `0`

Y position for overlay (default: 0)

##### options?

`Record`\<`string`, `string`\>

Additional overlay options

#### Returns

`null` \| `string`

Filter string or null if not supported

#### Example

```typescript
// Basic overlay at position
presets.overlay(100, 50);

// With additional options
presets.overlay(0, 0, { format: 'yuv420' });
```

#### See

[FFmpeg overlay filter](https://ffmpeg.org/ffmpeg-filters.html#overlay)

#### Inherited from

`FilterPresetBase.overlay`

***

### rotate()

> **rotate**(`angle`): `null` \| `string`

Defined in: [filter-presets.ts:155](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L155)

Creates a rotate filter string.

#### Parameters

##### angle

`number`

Rotation angle in degrees

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg rotate filter](https://ffmpeg.org/ffmpeg-filters.html#rotate)

#### Inherited from

`FilterPresetBase.rotate`

***

### scale()

> **scale**(`width`, `height`, `options?`): `null` \| `string`

Defined in: [filter-presets.ts:82](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L82)

Creates a scale filter string.

#### Parameters

##### width

`number`

Target width in pixels

##### height

`number`

Target height in pixels

##### options?

`Record`\<`string`, `any`\>

Additional scaling options (e.g., flags for algorithm)

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg scale filter](https://ffmpeg.org/ffmpeg-filters.html#scale)

#### Inherited from

`FilterPresetBase.scale`

***

### vflip()

> **vflip**(): `null` \| `string`

Defined in: [filter-presets.ts:177](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L177)

Creates a vertical flip filter string.

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg vflip filter](https://ffmpeg.org/ffmpeg-filters.html#vflip)

#### Inherited from

`FilterPresetBase.vflip`

***

### volume()

> **volume**(`factor`): `null` \| `string`

Defined in: [filter-presets.ts:232](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L232)

Creates a volume filter string for audio.

#### Parameters

##### factor

`number`

Volume multiplication factor (1.0 = unchanged, 2.0 = double)

#### Returns

`null` \| `string`

Filter string or null if not supported

#### See

[FFmpeg volume filter](https://ffmpeg.org/ffmpeg-filters.html#volume)

#### Inherited from

`FilterPresetBase.volume`

***

### afade()

> `static` **afade**(`type`, `start`, `duration`): `string`

Defined in: [filter-presets.ts:924](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L924)

Creates an audio fade filter string.

#### Parameters

##### type

Fade type ('in' or 'out')

`"in"` | `"out"`

##### start

`number`

Start time in seconds

##### duration

`number`

Fade duration in seconds

#### Returns

`string`

Audio fade filter string

***

### aformat()

> `static` **aformat**(`sampleFormat`, `sampleRate?`, `channelLayout?`): `string`

Defined in: [filter-presets.ts:900](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L900)

Creates an audio format filter string.

#### Parameters

##### sampleFormat

Target sample format

`string` | `AVSampleFormat`

##### sampleRate?

`number`

Target sample rate (optional)

##### channelLayout?

`string`

Target channel layout (optional)

#### Returns

`string`

Audio format filter string

***

### amix()

> `static` **amix**(`inputs`, `duration`): `string`

Defined in: [filter-presets.ts:936](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L936)

Creates an amix filter string.

#### Parameters

##### inputs

`number` = `2`

Number of inputs (default: 2)

##### duration

Duration mode (default: 'longest')

`"first"` | `"longest"` | `"shortest"`

#### Returns

`string`

Amix filter string

***

### atempo()

> `static` **atempo**(`factor`): `string`

Defined in: [filter-presets.ts:911](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L911)

Creates an atempo filter string.

#### Parameters

##### factor

`number`

Tempo factor (0.5 to 2.0)

#### Returns

`string`

Atempo filter string

***

### chain()

> `static` **chain**(): `FilterChainBuilder`

Defined in: [filter-presets.ts:772](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L772)

Creates a new filter chain builder.

#### Returns

`FilterChainBuilder`

A new FilterChainBuilder instance

#### Example

```typescript
const filter = FilterPresets.chain()
  .scale(1280, 720)
  .fps(30)
  .build();
```

***

### crop()

> `static` **crop**(`width`, `height`, `x`, `y`): `string`

Defined in: [filter-presets.ts:798](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L798)

Creates a crop filter string.

#### Parameters

##### width

`number`

Crop width

##### height

`number`

Crop height

##### x

`number` = `0`

X position (default: 0)

##### y

`number` = `0`

Y position (default: 0)

#### Returns

`string`

Crop filter string

***

### fade()

> `static` **fade**(`type`, `start`, `duration`): `string`

Defined in: [filter-presets.ts:864](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L864)

Creates a fade filter string.

#### Parameters

##### type

Fade type ('in' or 'out')

`"in"` | `"out"`

##### start

`number`

Start time in seconds

##### duration

`number`

Fade duration in seconds

#### Returns

`string`

Fade filter string

***

### format()

> `static` **format**(`pixelFormat`): `string`

Defined in: [filter-presets.ts:820](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L820)

Creates a format filter string.

#### Parameters

##### pixelFormat

Target pixel format(s)

`string` | `AVPixelFormat` | (`string` \| `AVPixelFormat`)[]

#### Returns

`string`

Format filter string

***

### fps()

> `static` **fps**(`fps`): `string`

Defined in: [filter-presets.ts:809](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L809)

Creates an FPS filter string.

#### Parameters

##### fps

`number`

Target frame rate

#### Returns

`string`

FPS filter string

***

### hflip()

> `static` **hflip**(): `string`

Defined in: [filter-presets.ts:841](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L841)

Creates a horizontal flip filter string.

#### Returns

`string`

Horizontal flip filter string

***

### overlay()

> `static` **overlay**(`x`, `y`): `string`

Defined in: [filter-presets.ts:876](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L876)

Creates an overlay filter string.

#### Parameters

##### x

`number` = `0`

X position (default: 0)

##### y

`number` = `0`

Y position (default: 0)

#### Returns

`string`

Overlay filter string

***

### rotate()

> `static` **rotate**(`angle`): `string`

Defined in: [filter-presets.ts:831](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L831)

Creates a rotate filter string.

#### Parameters

##### angle

`number`

Rotation angle in degrees

#### Returns

`string`

Rotate filter string

***

### scale()

> `static` **scale**(`width`, `height`, `flags?`): `string`

Defined in: [filter-presets.ts:784](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L784)

Creates a scale filter string.

#### Parameters

##### width

`number`

Target width

##### height

`number`

Target height

##### flags?

`string`

Scaling algorithm flags (optional)

#### Returns

`string`

Scale filter string

***

### vflip()

> `static` **vflip**(): `string`

Defined in: [filter-presets.ts:851](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L851)

Creates a vertical flip filter string.

#### Returns

`string`

Vertical flip filter string

***

### volume()

> `static` **volume**(`factor`): `string`

Defined in: [filter-presets.ts:887](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/filter-presets.ts#L887)

Creates a volume filter string.

#### Parameters

##### factor

`number`

Volume multiplication factor

#### Returns

`string`

Volume filter string
