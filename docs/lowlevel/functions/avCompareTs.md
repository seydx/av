[node-av](../globals.md) / avCompareTs

# Function: avCompareTs()

> **avCompareTs**(`tsA`, `tbA`, `tsB`, `tbB`): `number`

Defined in: [src/lib/utilities.ts:476](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L476)

Compare timestamps.

Compares two timestamps with different time bases.

Direct mapping to av_compare_ts().

## Parameters

### tsA

First timestamp

`null` | `number` | `bigint`

### tbA

[`IRational`](../interfaces/IRational.md)

First time base

### tsB

Second timestamp

`null` | `number` | `bigint`

### tbB

[`IRational`](../interfaces/IRational.md)

Second time base

## Returns

`number`

-1 if A < B, 0 if A == B, 1 if A > B

## Example

```typescript
const cmp = avCompareTs(
  1000n, { num: 1, den: 1000 },  // 1 second
  900n, { num: 1, den: 900 }      // 1 second
);
// Returns 0 (equal)
```
