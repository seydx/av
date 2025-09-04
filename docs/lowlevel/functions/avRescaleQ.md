[node-av](../globals.md) / avRescaleQ

# Function: avRescaleQ()

> **avRescaleQ**(`a`, `bq`, `cq`): `bigint`

Defined in: [src/lib/utilities.ts:503](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L503)

Rescale timestamp.

Rescales a timestamp from one time base to another.

Direct mapping to av_rescale_q().

## Parameters

### a

Timestamp to rescale

`null` | `number` | `bigint`

### bq

[`IRational`](../interfaces/IRational.md)

Source time base

### cq

[`IRational`](../interfaces/IRational.md)

Destination time base

## Returns

`bigint`

Rescaled timestamp

## Example

```typescript
// Convert 1 second from 1000Hz to 90kHz
const rescaled = avRescaleQ(
  1000n,
  { num: 1, den: 1000 },   // 1000 Hz
  { num: 1, den: 90000 }   // 90 kHz
);
// Returns 90000n
```
