[node-av](../globals.md) / avChannelLayoutDescribe

# Function: avChannelLayoutDescribe()

> **avChannelLayoutDescribe**(`channelLayout`): `null` \| `string`

Defined in: [src/lib/utilities.ts:654](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L654)

Describe channel layout.

Returns a human-readable description of a channel layout.

Direct mapping to av_channel_layout_describe().

## Parameters

### channelLayout

`Partial`\<[`ChannelLayout`](../interfaces/ChannelLayout.md)\>

Channel layout to describe

## Returns

`null` \| `string`

Layout description string, or null

## Example

```typescript
const stereo = { nbChannels: 2, order: 1, u: { mask: 3n } };
const desc = avChannelLayoutDescribe(stereo); // Returns "stereo"
```
