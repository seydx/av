[node-av](../globals.md) / avSdpCreate

# Function: avSdpCreate()

> **avSdpCreate**(`contexts`): `null` \| `string`

Defined in: [src/lib/utilities.ts:677](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L677)

Create SDP from format contexts.

Creates an SDP (Session Description Protocol) string from format contexts.
Used for RTP/RTSP streaming.

Direct mapping to av_sdp_create().

## Parameters

### contexts

[`FormatContext`](../classes/FormatContext.md)[]

Array of format contexts

## Returns

`null` \| `string`

SDP string, or null on error

## Example

```typescript
const sdp = avSdpCreate([outputContext]);
if (sdp) {
  console.log('SDP:\n' + sdp);
}
```
