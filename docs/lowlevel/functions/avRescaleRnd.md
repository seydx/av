[node-av](../globals.md) / avRescaleRnd

# Function: avRescaleRnd()

> **avRescaleRnd**(`a`, `b`, `c`, `rnd`): `bigint`

Defined in: [src/lib/utilities.ts:547](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L547)

Rescale with rounding.

Rescales a value with specified rounding behavior.

Direct mapping to av_rescale_rnd().

## Parameters

### a

Value to rescale

`number` | `bigint`

### b

Multiplier

`number` | `bigint`

### c

Divisor

`number` | `bigint`

### rnd

`number`

Rounding mode (AV_ROUND_*)

## Returns

`bigint`

Rescaled value

## Example

```typescript
import { AV_ROUND_NEAR_INF } from 'node-av/constants';

const rescaled = avRescaleRnd(1000n, 90000n, 1000n, AV_ROUND_NEAR_INF);
// Returns 90000n
```
