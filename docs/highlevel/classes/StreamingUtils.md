[node-av](../globals.md) / StreamingUtils

# Class: StreamingUtils

Defined in: [utilities/streaming.ts:37](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/streaming.ts#L37)

Streaming protocol utilities.

Provides static methods for SDP generation, RTP URL building, and
network streaming helpers for RTP/RTSP protocols.

## Example

```typescript
import { StreamingUtils, MediaOutput } from 'node-av/api';

// Create RTP outputs
const videoOutput = await MediaOutput.create('rtp://127.0.0.1:5004');
const audioOutput = await MediaOutput.create('rtp://127.0.0.1:5006');

// Generate SDP for streaming
const sdp = StreamingUtils.createSdp([videoOutput, audioOutput]);
if (sdp) {
  console.log('SDP for streaming:', sdp);
  // Save to .sdp file or serve via RTSP server
}
```

## Constructors

### Constructor

> **new StreamingUtils**(): `StreamingUtils`

#### Returns

`StreamingUtils`

## Methods

### buildRtpUrl()

> `static` **buildRtpUrl**(`host`, `port`, `options?`): `string`

Defined in: [utilities/streaming.ts:130](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/streaming.ts#L130)

Build RTP URL from components

Helper to construct RTP URLs with proper formatting.

#### Parameters

##### host

`string`

IP address or hostname

##### port

`number`

Port number

##### options?

Additional options

###### localrtcpport?

`number`

###### localrtpport?

`number`

###### pkt_size?

`number`

###### ttl?

`number`

#### Returns

`string`

Formatted RTP URL

#### Example

```typescript
// Unicast
const url1 = StreamingUtils.buildRtpUrl('127.0.0.1', 5004);
// 'rtp://127.0.0.1:5004'

// Multicast
const url2 = StreamingUtils.buildRtpUrl('239.0.0.1', 5004, { ttl: 64 });
// 'rtp://239.0.0.1:5004?ttl=64'
```

***

### createSdp()

> `static` **createSdp**(`inouts`): `null` \| `string`

Defined in: [utilities/streaming.ts:65](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/streaming.ts#L65)

Create an SDP (Session Description Protocol) string from media inputs/outputs

Generates an SDP description for RTP/RTSP streaming from one or more
configured media inputs/outputs. The inputs/outputs should be configured with RTP
format and have their streams set up before calling this method.

#### Parameters

##### inouts

Array of MediaInput or MediaOutput objects configured for RTP

[`MediaInput`](MediaInput.md)[] | [`MediaOutput`](MediaOutput.md)[]

#### Returns

`null` \| `string`

SDP string if successful, null if failed

#### Example

```typescript
// Set up RTP outputs with streams
const output1 = await MediaOutput.create('rtp://239.0.0.1:5004');
await output1.addVideoStream(encoder1);

const output2 = await MediaOutput.create('rtp://239.0.0.1:5006');
await output2.addAudioStream(encoder2);

// Generate SDP for multicast streaming
const sdp = StreamingUtils.createSdp([output1, output2]);
if (sdp) {
  // Write to file for VLC or other players
  await fs.writeFile('stream.sdp', sdp);
}
```

***

### isRtpOutput()

> `static` **isRtpOutput**(`output`): `boolean`

Defined in: [utilities/streaming.ts:98](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/streaming.ts#L98)

Validate if an output is configured for RTP streaming

#### Parameters

##### output

[`MediaOutput`](MediaOutput.md)

MediaOutput to check

#### Returns

`boolean`

true if configured for RTP

#### Example

```typescript
const output = await MediaOutput.create('rtp://127.0.0.1:5004');
if (StreamingUtils.isRtpOutput(output)) {
  const sdp = StreamingUtils.createSdpForOutput(output);
}
```
