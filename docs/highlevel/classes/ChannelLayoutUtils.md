[node-av](../globals.md) / ChannelLayoutUtils

# Class: ChannelLayoutUtils

Defined in: [utilities/channel-layout.ts:46](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/channel-layout.ts#L46)

Audio channel layout utilities.

Provides static methods for describing and working with audio channel layouts.
Channel layouts define the arrangement and meaning of audio channels in
multi-channel audio.

## Example

```typescript
import { ChannelLayoutUtils } from 'node-av';
import { AV_CHANNEL_ORDER_NATIVE } from 'node-av/constants';

// Describe a stereo layout
const stereo: ChannelLayout = {
  order: AV_CHANNEL_ORDER_NATIVE,
  nb_channels: 2,
  u: { mask: 0x3n } // FL | FR
};

const description = ChannelLayoutUtils.describe(stereo);
console.log(description); // "stereo"

// Describe a 5.1 layout
const surround: ChannelLayout = {
  order: AV_CHANNEL_ORDER_NATIVE,
  nb_channels: 6,
  u: { mask: 0x3Fn } // FL | FR | FC | LFE | BL | BR
};

console.log(ChannelLayoutUtils.describe(surround)); // "5.1"
```

## Methods

### describe()

> `static` **describe**(`channelLayout`): `null` \| `string`

Defined in: [utilities/channel-layout.ts:88](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/channel-layout.ts#L88)

Get string description of channel layout.

Returns a human-readable string describing the channel layout.
Direct mapping to av_channel_layout_describe()

#### Parameters

##### channelLayout

`Partial`\<`ChannelLayout`\>

Channel layout to describe

#### Returns

`null` \| `string`

String description, or null on error

#### Example

```typescript
import { ChannelLayoutUtils } from 'node-av';
import { AV_CHANNEL_ORDER_NATIVE, AV_CHANNEL_ORDER_CUSTOM } from 'node-av/constants';

// Standard layouts
const mono: ChannelLayout = {
  order: AV_CHANNEL_ORDER_NATIVE,
  nb_channels: 1,
  u: { mask: 0x4n } // FC
};
console.log(ChannelLayoutUtils.describe(mono)); // "mono"

const stereo: ChannelLayout = {
  order: AV_CHANNEL_ORDER_NATIVE,
  nb_channels: 2,
  u: { mask: 0x3n } // FL | FR
};
console.log(ChannelLayoutUtils.describe(stereo)); // "stereo"

// Custom layout
const custom: ChannelLayout = {
  order: AV_CHANNEL_ORDER_CUSTOM,
  nb_channels: 3,
  u: { map: null }
};
console.log(ChannelLayoutUtils.describe(custom)); // "3 channels"
```
