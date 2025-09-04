[node-av](../globals.md) / BitStreamFilter

# Class: BitStreamFilter

Defined in: [src/lib/bitstream-filter.ts:36](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter.ts#L36)

Bitstream filter descriptor.

Provides access to bitstream filter properties and codec compatibility information.
Bitstream filters are used to modify or analyze compressed bitstreams without
full decoding/encoding. Common uses include H.264/HEVC parameter set extraction,
VP9 superframe splitting, and adding/removing codec-specific headers.

Direct mapping to FFmpeg's AVBitStreamFilter.

## Example

```typescript
import { BitStreamFilter } from 'node-av';

// Get a specific bitstream filter
const h264Filter = BitStreamFilter.getByName('h264_mp4toannexb');
if (h264Filter) {
  console.log(`Filter: ${h264Filter.name}`);
  console.log(`Supported codecs: ${h264Filter.codecIds}`);
}

// List all available bitstream filters
const filters = BitStreamFilter.iterate();
for (const filter of filters) {
  console.log(`- ${filter.name}`);
}
```

## See

\[AVBitStreamFilter\](https://ffmpeg.org/doxygen/trunk/structAVBitStreamFilter.html)

## Implements

- `NativeWrapper`\<`NativeBitStreamFilter`\>

## Constructors

### Constructor

> **new BitStreamFilter**(`native`): `BitStreamFilter`

Defined in: [src/lib/bitstream-filter.ts:43](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter.ts#L43)

**`Internal`**

#### Parameters

##### native

`NativeBitStreamFilter`

The native bitstream filter instance

#### Returns

`BitStreamFilter`

## Accessors

### codecIds

#### Get Signature

> **get** **codecIds**(): `null` \| `AVCodecID`[]

Defined in: [src/lib/bitstream-filter.ts:147](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter.ts#L147)

List of supported codec IDs.

Array of codec IDs that this filter can process.
If null, the filter supports all codecs.

Direct mapping to AVBitStreamFilter->codec_ids.

##### Example

```typescript
import { AV_CODEC_ID_H264, AV_CODEC_ID_HEVC } from 'node-av/constants';

const filter = BitStreamFilter.getByName('extract_extradata');
if (filter?.codecIds) {
  const supportsH264 = filter.codecIds.includes(AV_CODEC_ID_H264);
  const supportsHEVC = filter.codecIds.includes(AV_CODEC_ID_HEVC);
  console.log(`H.264 support: ${supportsH264}`);
  console.log(`HEVC support: ${supportsHEVC}`);
}
```

##### Returns

`null` \| `AVCodecID`[]

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/bitstream-filter.ts:122](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter.ts#L122)

Name of the bitstream filter.

Human-readable name identifying the filter (e.g., 'h264_mp4toannexb').

Direct mapping to AVBitStreamFilter->name.

##### Returns

`null` \| `string`

## Methods

### getNative()

> **getNative**(): `NativeBitStreamFilter`

Defined in: [src/lib/bitstream-filter.ts:158](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter.ts#L158)

**`Internal`**

Get the underlying native BitStreamFilter object.

#### Returns

`NativeBitStreamFilter`

The native BitStreamFilter binding object

#### Implementation of

`NativeWrapper.getNative`

***

### getByName()

> `static` **getByName**(`name`): `null` \| `BitStreamFilter`

Defined in: [src/lib/bitstream-filter.ts:74](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter.ts#L74)

Get a bitstream filter by name.

Retrieves a specific bitstream filter descriptor by its name.
Common filter names include 'h264_mp4toannexb', 'hevc_mp4toannexb',
'extract_extradata', 'vp9_superframe', etc.

Direct mapping to av_bsf_get_by_name().

#### Parameters

##### name

`string`

Name of the bitstream filter

#### Returns

`null` \| `BitStreamFilter`

BitStreamFilter instance if found, null otherwise

#### Example

```typescript
// Get H.264 stream format converter
const h264Filter = BitStreamFilter.getByName('h264_mp4toannexb');
if (!h264Filter) {
  throw new Error('H.264 bitstream filter not available');
}

// Get HEVC metadata extractor
const hevcFilter = BitStreamFilter.getByName('hevc_metadata');
```

#### See

 - [iterate](#iterate) To list all available filters
 - [BitStreamFilterContext.alloc](BitStreamFilterContext.md#alloc) To use the filter

***

### iterate()

> `static` **iterate**(): `BitStreamFilter`[]

Defined in: [src/lib/bitstream-filter.ts:110](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/bitstream-filter.ts#L110)

Iterate over all available bitstream filters.

Returns an array of all registered bitstream filters in FFmpeg.
Useful for discovering available filters or building filter lists.

Direct mapping to av_bsf_iterate().

#### Returns

`BitStreamFilter`[]

Array of all available bitstream filters

#### Example

```typescript
import { BitStreamFilter } from 'node-av';
import { AV_CODEC_ID_H264 } from 'node-av/constants';

// List all available filters
const filters = BitStreamFilter.iterate();
console.log(`Found ${filters.length} bitstream filters`);

// Find filters that support H.264
const h264Filters = filters.filter(f =>
  f.codecIds?.includes(AV_CODEC_ID_H264)
);
console.log('H.264 compatible filters:');
for (const filter of h264Filters) {
  console.log(`- ${filter.name}`);
}
```

#### See

[getByName](#getbyname) To get a specific filter
