[node-av](../globals.md) / SampleFormat

# Class: SampleFormat

Defined in: [utilities/sample-format.ts:36](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/sample-format.ts#L36)

Audio sample format utilities.

Provides static methods for querying and converting between audio sample formats.
These utilities help with format introspection, conversion between packed/planar
layouts, and getting human-readable format information.

## Example

```typescript
import { SampleFormat } from 'node-av';
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

// Get format information
console.log(SampleFormat.getName(AV_SAMPLE_FMT_S16));        // "s16"
console.log(SampleFormat.getBytesPerSample(AV_SAMPLE_FMT_S16)); // 2
console.log(SampleFormat.isPlanar(AV_SAMPLE_FMT_FLTP));      // true

// Convert between packed and planar formats
const packed = SampleFormat.getPackedFormat(AV_SAMPLE_FMT_FLTP);
const planar = SampleFormat.getPlanarFormat(AV_SAMPLE_FMT_FLT);
```

## Methods

### getBytesPerSample()

> `static` **getBytesPerSample**(`format`): `number`

Defined in: [utilities/sample-format.ts:58](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/sample-format.ts#L58)

Get bytes per sample for a sample format.

Returns the number of bytes required to store one sample in the given format.
Direct mapping to av_get_bytes_per_sample()

#### Parameters

##### format

`AVSampleFormat`

Audio sample format

#### Returns

`number`

Number of bytes per sample, or 0 for invalid format

#### Example

```typescript
import { SampleFormat } from 'node-av';
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLT } from 'node-av/constants';

console.log(SampleFormat.getBytesPerSample(AV_SAMPLE_FMT_S16)); // 2
console.log(SampleFormat.getBytesPerSample(AV_SAMPLE_FMT_FLT)); // 4
```

***

### getName()

> `static` **getName**(`format`): `null` \| `string`

Defined in: [utilities/sample-format.ts:80](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/sample-format.ts#L80)

Get the name of a sample format.

Returns a string describing the sample format.
Direct mapping to av_get_sample_fmt_name()

#### Parameters

##### format

`AVSampleFormat`

Audio sample format

#### Returns

`null` \| `string`

Format name string, or null for invalid format

#### Example

```typescript
import { SampleFormat } from 'node-av';
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

console.log(SampleFormat.getName(AV_SAMPLE_FMT_S16));  // "s16"
console.log(SampleFormat.getName(AV_SAMPLE_FMT_FLTP)); // "fltp"
```

***

### getPackedFormat()

> `static` **getPackedFormat**(`format`): `AVSampleFormat`

Defined in: [utilities/sample-format.ts:103](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/sample-format.ts#L103)

Get packed sample format.

Returns the packed variant of the given sample format.
If the format is already packed, returns it unchanged.
Direct mapping to av_get_packed_sample_fmt()

#### Parameters

##### format

`AVSampleFormat`

Audio sample format

#### Returns

`AVSampleFormat`

Packed sample format

#### Example

```typescript
import { SampleFormat } from 'node-av';
import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_FLT } from 'node-av/constants';

const packed = SampleFormat.getPackedFormat(AV_SAMPLE_FMT_FLTP);
console.log(packed === AV_SAMPLE_FMT_FLT); // true
```

***

### getPlanarFormat()

> `static` **getPlanarFormat**(`format`): `AVSampleFormat`

Defined in: [utilities/sample-format.ts:126](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/sample-format.ts#L126)

Get planar sample format.

Returns the planar variant of the given sample format.
If the format is already planar, returns it unchanged.
Direct mapping to av_get_planar_sample_fmt()

#### Parameters

##### format

`AVSampleFormat`

Audio sample format

#### Returns

`AVSampleFormat`

Planar sample format

#### Example

```typescript
import { SampleFormat } from 'node-av';
import { AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';

const planar = SampleFormat.getPlanarFormat(AV_SAMPLE_FMT_FLT);
console.log(planar === AV_SAMPLE_FMT_FLTP); // true
```

***

### isPlanar()

> `static` **isPlanar**(`format`): `boolean`

Defined in: [utilities/sample-format.ts:149](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/sample-format.ts#L149)

Check if sample format is planar.

Returns true if the sample format stores each channel in a separate buffer.
Returns false if all channels are interleaved in a single buffer.
Direct mapping to av_sample_fmt_is_planar()

#### Parameters

##### format

`AVSampleFormat`

Audio sample format

#### Returns

`boolean`

True if format is planar, false if packed/interleaved

#### Example

```typescript
import { SampleFormat } from 'node-av';
import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_S16P } from 'node-av/constants';

console.log(SampleFormat.isPlanar(AV_SAMPLE_FMT_S16));  // false (packed)
console.log(SampleFormat.isPlanar(AV_SAMPLE_FMT_S16P)); // true (planar)
```
